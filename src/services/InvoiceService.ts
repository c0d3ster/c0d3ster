import { and, asc, desc, eq, inArray, like, sql } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import type {
  CreateInvoiceInput,
  InvoiceLineItemInput,
  ProjectFeature,
  UpdateInvoiceInput,
} from '@/graphql/schema'
import type { InvoiceLineItemRecord, InvoiceRecord } from '@/models'

import { DiscountType, InvoiceStatus } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { featurePricing } from '@/libs/featurePricing'
import { schemas } from '@/models'

export type InvoiceDetail = InvoiceRecord & {
  lineItems: InvoiceLineItemRecord[]
}

type RecordPaymentInput = {
  invoiceId: string
  amount: number
  checkoutSessionId: string
  paymentIntentId: string | null
}

type RecordPaymentResult = { recorded: boolean; status: InvoiceStatus }

type TotalsInput = {
  lineItems: { quantity: number; unitPrice: number }[]
  discountType?: DiscountType | null
  discountValue?: number | null
  taxRate: number
}

type InvoiceTotals = {
  lineTotals: number[]
  subtotal: number
  discountAmount: number | null
  taxAmount: number
  totalAmount: number
}

type NormalizedLineItem = {
  feature: ProjectFeature | null
  description: string
  quantity: number
  unitPrice: number
}

// Statuses an admin can still edit
const EDITABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.Draft,
  InvoiceStatus.Sent,
]

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.Draft]: [InvoiceStatus.Sent, InvoiceStatus.Cancelled],
  [InvoiceStatus.Sent]: [
    InvoiceStatus.Viewed,
    InvoiceStatus.PartiallyPaid,
    InvoiceStatus.Paid,
    InvoiceStatus.Overdue,
    InvoiceStatus.Cancelled,
  ],
  [InvoiceStatus.Viewed]: [
    InvoiceStatus.PartiallyPaid,
    InvoiceStatus.Paid,
    InvoiceStatus.Overdue,
    InvoiceStatus.Cancelled,
  ],
  [InvoiceStatus.PartiallyPaid]: [
    InvoiceStatus.Paid,
    InvoiceStatus.Overdue,
    InvoiceStatus.Cancelled,
  ],
  [InvoiceStatus.Overdue]: [
    InvoiceStatus.PartiallyPaid,
    InvoiceStatus.Paid,
    InvoiceStatus.Cancelled,
  ],
  [InvoiceStatus.Paid]: [],
  [InvoiceStatus.Cancelled]: [],
}

const PG_UNIQUE_VIOLATION = '23505'

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

const badInput = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })

const isUniqueViolation = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  if ('code' in error && error.code === PG_UNIQUE_VIOLATION) return true
  return 'cause' in error && isUniqueViolation(error.cause)
}

/**
 * Single source of truth for invoice math, shared by create and update.
 * Order: subtotal -> discountAmount -> taxAmount (on the post-discount amount) -> totalAmount.
 * discountAmount is null when no discount applies.
 */
export const calculateInvoiceTotals = ({
  lineItems,
  discountType,
  discountValue,
  taxRate,
}: TotalsInput): InvoiceTotals => {
  if (taxRate < 0 || taxRate > 1) {
    throw badInput('taxRate must be a decimal between 0 and 1')
  }

  const lineTotals = lineItems.map(({ quantity, unitPrice }) =>
    round2(quantity * unitPrice)
  )
  const subtotal = round2(lineTotals.reduce((sum, total) => sum + total, 0))

  let discountAmount: number | null = null
  if (discountType) {
    if (discountValue === null || discountValue === undefined) {
      throw badInput('discountValue is required when discountType is set')
    }
    if (discountValue < 0) {
      throw badInput('discountValue cannot be negative')
    }
    if (discountType === DiscountType.Percentage) {
      if (discountValue > 100) {
        throw badInput('Percentage discount cannot exceed 100')
      }
      discountAmount = round2((subtotal * discountValue) / 100)
    } else {
      // A flat discount can never push the invoice below zero
      discountAmount = round2(Math.min(discountValue, subtotal))
    }
  }

  const discounted = round2(subtotal - (discountAmount ?? 0))
  const taxAmount = round2(discounted * taxRate)

  return {
    lineTotals,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount: round2(discounted + taxAmount),
  }
}

// Based on the post-discount totalAmount
export const calculateDepositAmount = (
  totalAmount: number,
  depositPercent: number | null
): number => round2((totalAmount * (depositPercent ?? 0)) / 100)

const assertTransition = (from: InvoiceStatus, to: InvoiceStatus): void => {
  if (STATUS_TRANSITIONS[from].includes(to)) return
  throw new GraphQLError(`Cannot change invoice status from ${from} to ${to}`, {
    extensions: { code: 'INVALID_STATUS' },
  })
}

const assertDepositPercent = (depositPercent?: number | null): void => {
  if (depositPercent === null || depositPercent === undefined) return
  if (
    !Number.isInteger(depositPercent) ||
    depositPercent < 0 ||
    depositPercent > 100
  ) {
    throw badInput('depositPercent must be an integer between 0 and 100')
  }
}

const assertLineItems = (lineItems: InvoiceLineItemInput[]): void => {
  for (const { quantity, unitPrice } of lineItems) {
    if ((quantity ?? 1) <= 0) {
      throw badInput('Line item quantity must be positive')
    }
    if (unitPrice < 0) throw badInput('Line item unitPrice cannot be negative')
  }
}

const toDate = (value: string | null | undefined): Date | null =>
  value ? new Date(value) : null

const normalizeLineItems = (
  lineItems: InvoiceLineItemInput[]
): NormalizedLineItem[] =>
  lineItems.map(({ feature, description, quantity, unitPrice }) => ({
    feature: feature ?? null,
    description,
    quantity: quantity ?? 1,
    unitPrice,
  }))

// Default line items for a project's features. Pricing is admin-only reference data.
const lineItemsFromFeatures = (
  features: ProjectFeature[] | null
): NormalizedLineItem[] =>
  (features ?? []).flatMap((feature) => {
    const pricing = featurePricing[feature]
    if (!pricing) return []
    return [
      {
        feature,
        description: pricing.label,
        quantity: 1,
        unitPrice: pricing.defaultPrice,
      },
    ]
  })

export class InvoiceService {
  async getInvoiceById(id: string): Promise<InvoiceDetail | undefined> {
    const invoice = await db.query.invoices.findFirst({
      where: eq(schemas.invoices.id, id),
    })
    if (!invoice) return undefined
    const [detail] = await this.withLineItems([invoice])
    return detail
  }

  async getProjectInvoices(projectId: string): Promise<InvoiceDetail[]> {
    const invoices = await db.query.invoices.findMany({
      where: eq(schemas.invoices.projectId, projectId),
      orderBy: [desc(schemas.invoices.createdAt)],
    })
    return this.withLineItems(invoices)
  }

  async getClientInvoices(clientId: string): Promise<InvoiceDetail[]> {
    // Drafts are admin-only until sent
    const invoices = await db.query.invoices.findMany({
      where: and(
        eq(schemas.invoices.clientId, clientId),
        inArray(
          schemas.invoices.status,
          Object.values(InvoiceStatus).filter(
            (status) => status !== InvoiceStatus.Draft
          )
        )
      ),
      orderBy: [desc(schemas.invoices.createdAt)],
    })
    return this.withLineItems(invoices)
  }

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceDetail> {
    assertDepositPercent(input.depositPercent)
    if (input.lineItems) assertLineItems(input.lineItems)

    const project = await db.query.projects.findFirst({
      where: eq(schemas.projects.id, input.projectId),
    })
    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Omitted lineItems = auto-populate from features; an explicit list is used as-is
    const lineItems = input.lineItems
      ? normalizeLineItems(input.lineItems)
      : lineItemsFromFeatures(project.features)
    const taxRate = input.taxRate ?? 0
    const totals = calculateInvoiceTotals({
      lineItems,
      discountType: input.discountType,
      discountValue: input.discountValue,
      taxRate,
    })
    const hasDiscount = Boolean(input.discountType)

    try {
      const invoiceId = await db.transaction(async (tx) => {
        const invoiceNumber = await this.generateInvoiceNumber(tx)

        const [created] = await tx
          .insert(schemas.invoices)
          .values({
            projectId: project.id,
            clientId: project.clientId,
            invoiceNumber,
            status: InvoiceStatus.Draft,
            depositPercent: input.depositPercent ?? null,
            depositDueDate: toDate(input.depositDueDate),
            balanceDueDate: toDate(input.balanceDueDate),
            subtotal: totals.subtotal,
            discountType: hasDiscount ? input.discountType : null,
            discountValue: hasDiscount ? (input.discountValue ?? null) : null,
            discountLabel: hasDiscount ? (input.discountLabel ?? null) : null,
            discountAmount: totals.discountAmount,
            taxRate,
            taxAmount: totals.taxAmount,
            totalAmount: totals.totalAmount,
            notes: input.notes ?? null,
            paymentInstructions: input.paymentInstructions ?? null,
          })
          .returning({ id: schemas.invoices.id })

        if (!created) {
          throw new GraphQLError('Failed to create invoice', {
            extensions: { code: 'INVOICE_CREATION_FAILED' },
          })
        }

        await this.insertLineItems(tx, created.id, lineItems, totals.lineTotals)
        return created.id
      })

      return await this.requireInvoice(invoiceId)
    } catch (error) {
      // The invoiceNumber unique constraint is the backstop for concurrent creates
      if (isUniqueViolation(error)) {
        throw new GraphQLError('Invoice number collision, please retry', {
          extensions: { code: 'CONFLICT' },
        })
      }
      throw error
    }
  }

  async updateInvoice(
    id: string,
    input: UpdateInvoiceInput
  ): Promise<InvoiceDetail> {
    assertDepositPercent(input.depositPercent)
    if (input.lineItems) assertLineItems(input.lineItems)

    const existing = await this.requireInvoice(id)
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      throw new GraphQLError(`Cannot edit a ${existing.status} invoice`, {
        extensions: { code: 'INVALID_STATUS' },
      })
    }

    // undefined = leave unchanged, null (discount fields only) = clear
    const discountType =
      input.discountType === undefined
        ? existing.discountType
        : input.discountType
    const hasDiscount = Boolean(discountType)
    const discountValue = hasDiscount
      ? input.discountValue === undefined
        ? existing.discountValue
        : input.discountValue
      : null
    const discountLabel = hasDiscount
      ? input.discountLabel === undefined
        ? existing.discountLabel
        : input.discountLabel
      : null
    const taxRate = input.taxRate ?? existing.taxRate

    const lineItems = input.lineItems
      ? normalizeLineItems(input.lineItems)
      : existing.lineItems
    const totals = calculateInvoiceTotals({
      lineItems,
      discountType,
      discountValue,
      taxRate,
    })

    await db.transaction(async (tx) => {
      await tx
        .update(schemas.invoices)
        .set({
          depositPercent:
            input.depositPercent === undefined
              ? existing.depositPercent
              : input.depositPercent,
          depositDueDate:
            input.depositDueDate === undefined
              ? existing.depositDueDate
              : toDate(input.depositDueDate),
          balanceDueDate:
            input.balanceDueDate === undefined
              ? existing.balanceDueDate
              : toDate(input.balanceDueDate),
          subtotal: totals.subtotal,
          discountType,
          discountValue,
          discountLabel,
          discountAmount: totals.discountAmount,
          taxRate,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          notes: input.notes ?? existing.notes,
          paymentInstructions:
            input.paymentInstructions ?? existing.paymentInstructions,
        })
        .where(eq(schemas.invoices.id, id))

      if (input.lineItems) {
        await tx
          .delete(schemas.invoiceLineItems)
          .where(eq(schemas.invoiceLineItems.invoiceId, id))
        await this.insertLineItems(
          tx,
          id,
          normalizeLineItems(input.lineItems),
          totals.lineTotals
        )
      }
    })

    return this.requireInvoice(id)
  }

  // Email delivery lands in Phase 5; this only validates and flips status
  async sendInvoice(id: string): Promise<InvoiceDetail> {
    const existing = await this.requireInvoice(id)
    assertTransition(existing.status, InvoiceStatus.Sent)

    if (existing.lineItems.length === 0) {
      throw new GraphQLError('Cannot send an invoice with no line items', {
        extensions: { code: 'INVALID_STATE' },
      })
    }

    await db
      .update(schemas.invoices)
      .set({ status: InvoiceStatus.Sent, sentAt: new Date() })
      .where(eq(schemas.invoices.id, id))

    return this.requireInvoice(id)
  }

  // Called from the Stripe webhook. Idempotent per checkout session: Stripe retries deliveries.
  async recordPayment({
    invoiceId,
    amount,
    checkoutSessionId,
    paymentIntentId,
  }: RecordPaymentInput): Promise<RecordPaymentResult> {
    return db.transaction(async (tx) => {
      const [invoice] = await tx
        .select()
        .from(schemas.invoices)
        .where(eq(schemas.invoices.id, invoiceId))
        .for('update')

      if (!invoice) {
        throw new GraphQLError('Invoice not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }
      if (invoice.stripeCheckoutSessionId === checkoutSessionId) {
        return { recorded: false, status: invoice.status }
      }

      const paidAmount = round2(invoice.paidAmount + amount)
      const status =
        paidAmount >= invoice.totalAmount
          ? InvoiceStatus.Paid
          : InvoiceStatus.PartiallyPaid
      if (status !== invoice.status) assertTransition(invoice.status, status)

      await tx
        .update(schemas.invoices)
        .set({
          paidAmount,
          status,
          stripeCheckoutSessionId: checkoutSessionId,
          stripePaymentIntentId: paymentIntentId,
          ...(status === InvoiceStatus.Paid && { paidAt: new Date() }),
        })
        .where(eq(schemas.invoices.id, invoiceId))

      // Project total is derived from every invoice, so replays can never double count
      const [projectTotal] = await tx
        .select({
          total: sql<string | null>`coalesce(sum(${schemas.invoices.paidAmount}), 0)`,
        })
        .from(schemas.invoices)
        .where(eq(schemas.invoices.projectId, invoice.projectId))
      await tx
        .update(schemas.projects)
        .set({ paidAmount: round2(Number(projectTotal?.total ?? 0)) })
        .where(eq(schemas.projects.id, invoice.projectId))

      return { recorded: true, status }
    })
  }

  private async requireInvoice(id: string): Promise<InvoiceDetail> {
    const invoice = await this.getInvoiceById(id)
    if (!invoice) {
      throw new GraphQLError('Invoice not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return invoice
  }

  private async withLineItems(
    invoices: InvoiceRecord[]
  ): Promise<InvoiceDetail[]> {
    if (invoices.length === 0) return []

    const items = await db.query.invoiceLineItems.findMany({
      where: inArray(
        schemas.invoiceLineItems.invoiceId,
        invoices.map(({ id }) => id)
      ),
      orderBy: [asc(schemas.invoiceLineItems.sortOrder)],
    })

    return invoices.map((invoice) => ({
      ...invoice,
      lineItems: items.filter(({ invoiceId }) => invoiceId === invoice.id),
    }))
  }

  private async insertLineItems(
    tx: Pick<typeof db, 'insert'>,
    invoiceId: string,
    lineItems: NormalizedLineItem[],
    lineTotals: number[]
  ): Promise<void> {
    if (lineItems.length === 0) return
    await tx.insert(schemas.invoiceLineItems).values(
      lineItems.map((item, index) => ({
        invoiceId,
        feature: item.feature,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: lineTotals[index] ?? 0,
        sortOrder: index,
      }))
    )
  }

  // INV-YYYY-NNN: COUNT-based per-year sequence. Concurrent creates can compute the same
  // number; the invoiceNumber unique constraint rejects the loser (mapped to CONFLICT).
  private async generateInvoiceNumber(
    tx: Pick<typeof db, 'select'>
  ): Promise<string> {
    const year = new Date().getFullYear()
    const [row] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(schemas.invoices)
      .where(like(schemas.invoices.invoiceNumber, `INV-${year}-%`))

    const next = Number(row?.count ?? 0) + 1
    return `INV-${year}-${String(next).padStart(3, '0')}`
  }
}
