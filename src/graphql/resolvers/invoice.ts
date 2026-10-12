import { GraphQLError } from 'graphql'
import {
  Arg,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'

import type { InvoiceDetail, InvoiceService, UserService } from '@/services'

import {
  CreateInvoiceInput,
  Invoice,
  InvoiceStatus,
  UpdateInvoiceInput,
  UserRole,
} from '@/graphql/schema'
import {
  calculateDepositAmount,
  deriveInvoiceAmounts,
} from '@/services/InvoiceService'
import { isAdminRole } from '@/utils'

const toIso = (date: Date | null): string | null =>
  date?.toISOString() ?? null

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(
    private invoiceService: InvoiceService,
    private userService: UserService
  ) {}

  @Mutation(() => Invoice)
  async createInvoice(
    @Arg('input', () => CreateInvoiceInput) input: CreateInvoiceInput
  ): Promise<InvoiceDetail> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return this.invoiceService.createInvoice(input)
  }

  @Mutation(() => Invoice)
  async updateInvoice(
    @Arg('id', () => ID) id: string,
    @Arg('input', () => UpdateInvoiceInput) input: UpdateInvoiceInput
  ): Promise<InvoiceDetail> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return this.invoiceService.updateInvoice(id, input)
  }

  @Mutation(() => Invoice)
  async sendInvoice(@Arg('id', () => ID) id: string): Promise<InvoiceDetail> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return this.invoiceService.sendInvoice(id)
  }

  @Query(() => Invoice, { nullable: true })
  async getInvoice(
    @Arg('id', () => ID) id: string
  ): Promise<InvoiceDetail | undefined> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    const invoice = await this.invoiceService.getInvoiceById(id)
    if (!invoice) return undefined

    if (isAdminRole(currentUser.role)) return invoice

    // Clients only see their own invoices, and never drafts. Report both as
    // missing so invoice ids can't be probed.
    if (
      invoice.clientId !== currentUser.id ||
      invoice.status === InvoiceStatus.Draft
    ) {
      throw new GraphQLError('Invoice not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return invoice
  }

  @Query(() => [Invoice])
  async getProjectInvoices(
    @Arg('projectId', () => ID) projectId: string
  ): Promise<InvoiceDetail[]> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    const invoices = await this.invoiceService.getProjectInvoices(projectId)
    return invoices
  }

  @Query(() => [Invoice])
  async getMyInvoices(): Promise<InvoiceDetail[]> {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Client)
    const invoices = await this.invoiceService.getClientInvoices(currentUser.id)
    return invoices
  }

  // Derived on read: only totalAmount is stored (see deriveInvoiceAmounts)
  @FieldResolver(() => Number)
  subtotal(@Root() invoice: InvoiceDetail): number {
    return deriveInvoiceAmounts(invoice).subtotal
  }

  @FieldResolver(() => Number, { nullable: true })
  discountAmount(@Root() invoice: InvoiceDetail): number | null {
    return deriveInvoiceAmounts(invoice).discountAmount
  }

  @FieldResolver(() => Number)
  taxAmount(@Root() invoice: InvoiceDetail): number {
    return deriveInvoiceAmounts(invoice).taxAmount
  }

  @FieldResolver(() => Number)
  depositAmount(@Root() invoice: InvoiceDetail): number {
    return calculateDepositAmount(invoice.totalAmount, invoice.depositPercent)
  }

  // Dates are exposed as ISO strings, matching the rest of the schema
  @FieldResolver(() => String, { nullable: true })
  depositDueDate(@Root() invoice: InvoiceDetail): string | null {
    return toIso(invoice.depositDueDate)
  }

  @FieldResolver(() => String, { nullable: true })
  balanceDueDate(@Root() invoice: InvoiceDetail): string | null {
    return toIso(invoice.balanceDueDate)
  }

  @FieldResolver(() => String, { nullable: true })
  sentAt(@Root() invoice: InvoiceDetail): string | null {
    return toIso(invoice.sentAt)
  }

  @FieldResolver(() => String, { nullable: true })
  viewedAt(@Root() invoice: InvoiceDetail): string | null {
    return toIso(invoice.viewedAt)
  }

  @FieldResolver(() => String, { nullable: true })
  paidAt(@Root() invoice: InvoiceDetail): string | null {
    return toIso(invoice.paidAt)
  }

  @FieldResolver(() => String)
  createdAt(@Root() invoice: InvoiceDetail): string {
    return invoice.createdAt.toISOString()
  }

  @FieldResolver(() => String)
  updatedAt(@Root() invoice: InvoiceDetail): string {
    return invoice.updatedAt.toISOString()
  }
}
