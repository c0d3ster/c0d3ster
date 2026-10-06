import { GraphQLError } from 'graphql'
import { Arg, ID, Mutation, Query, Resolver } from 'type-graphql'

import type { UserRecord } from '@/models'
import type { InvoiceDetail, InvoiceService, UserService } from '@/services'

import {
  CreateInvoiceInput,
  Invoice,
  InvoiceStatus,
  UpdateInvoiceInput,
  UserRole,
} from '@/graphql/schema'
import { calculateDepositAmount } from '@/services/InvoiceService'
import { isAdminRole } from '@/utils'

const toInvoiceType = (detail: InvoiceDetail): Invoice => ({
  id: detail.id,
  projectId: detail.projectId,
  clientId: detail.clientId,
  invoiceNumber: detail.invoiceNumber,
  status: detail.status,
  depositPercent: detail.depositPercent ?? undefined,
  depositAmount: calculateDepositAmount(
    detail.totalAmount,
    detail.depositPercent
  ),
  depositDueDate: detail.depositDueDate?.toISOString(),
  balanceDueDate: detail.balanceDueDate?.toISOString(),
  subtotal: detail.subtotal,
  discountType: detail.discountType ?? undefined,
  discountValue: detail.discountValue ?? undefined,
  discountLabel: detail.discountLabel ?? undefined,
  discountAmount: detail.discountAmount ?? undefined,
  taxRate: detail.taxRate,
  taxAmount: detail.taxAmount,
  totalAmount: detail.totalAmount,
  paidAmount: detail.paidAmount,
  notes: detail.notes ?? undefined,
  paymentInstructions: detail.paymentInstructions ?? undefined,
  sentAt: detail.sentAt?.toISOString(),
  viewedAt: detail.viewedAt?.toISOString(),
  paidAt: detail.paidAt?.toISOString(),
  createdAt: detail.createdAt.toISOString(),
  updatedAt: detail.updatedAt.toISOString(),
  lineItems: detail.lineItems.map((item) => ({
    id: item.id,
    invoiceId: item.invoiceId,
    feature: item.feature ?? undefined,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
    sortOrder: item.sortOrder,
  })),
})

const notFound = (): GraphQLError =>
  new GraphQLError('Invoice not found', { extensions: { code: 'NOT_FOUND' } })

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(
    private invoiceService: InvoiceService,
    private userService: UserService
  ) {}

  @Mutation(() => Invoice)
  async createInvoice(
    @Arg('input', () => CreateInvoiceInput) input: CreateInvoiceInput
  ): Promise<Invoice> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return toInvoiceType(await this.invoiceService.createInvoice(input))
  }

  @Mutation(() => Invoice)
  async updateInvoice(
    @Arg('id', () => ID) id: string,
    @Arg('input', () => UpdateInvoiceInput) input: UpdateInvoiceInput
  ): Promise<Invoice> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return toInvoiceType(await this.invoiceService.updateInvoice(id, input))
  }

  @Mutation(() => Invoice)
  async sendInvoice(@Arg('id', () => ID) id: string): Promise<Invoice> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return toInvoiceType(await this.invoiceService.sendInvoice(id))
  }

  // Only the owning client's open counts as a view; an admin previewing is a no-op
  @Mutation(() => Invoice)
  async markInvoiceViewed(@Arg('id', () => ID) id: string): Promise<Invoice> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    const invoice = await this.getVisibleInvoice(id, currentUser)
    if (!invoice) throw notFound()
    if (isAdminRole(currentUser.role)) return toInvoiceType(invoice)
    return toInvoiceType(await this.invoiceService.markViewed(id))
  }

  @Query(() => Invoice, { nullable: true })
  async getInvoice(
    @Arg('id', () => ID) id: string
  ): Promise<Invoice | undefined> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    const invoice = await this.getVisibleInvoice(id, currentUser)
    return invoice && toInvoiceType(invoice)
  }

  @Query(() => [Invoice])
  async getProjectInvoices(
    @Arg('projectId', () => ID) projectId: string
  ): Promise<Invoice[]> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    const invoices = await this.invoiceService.getProjectInvoices(projectId)
    return invoices.map(toInvoiceType)
  }

  @Query(() => [Invoice])
  async getMyInvoices(): Promise<Invoice[]> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Client)
    const invoices = await this.invoiceService.getClientInvoices(currentUser.id)
    return invoices.map(toInvoiceType)
  }

  // Clients only see their own invoices, and never drafts. Report both as
  // missing so invoice ids can't be probed.
  private async getVisibleInvoice(
    id: string,
    currentUser: UserRecord
  ): Promise<InvoiceDetail | undefined> {
    const invoice = await this.invoiceService.getInvoiceById(id)
    if (!invoice || isAdminRole(currentUser.role)) return invoice
    if (
      invoice.clientId !== currentUser.id ||
      invoice.status === InvoiceStatus.Draft
    ) {
      throw notFound()
    }
    return invoice
  }
}
