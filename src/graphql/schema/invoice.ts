import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

import { ProjectFeature } from './project'

export enum InvoiceStatus {
  Draft = 'draft',
  Sent = 'sent',
  Viewed = 'viewed',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
}

export enum DiscountType {
  Percentage = 'percentage',
  Flat = 'flat',
}

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
  description: 'Status of an invoice',
})

registerEnumType(DiscountType, {
  name: 'DiscountType',
  description: 'How an invoice discount value is applied',
})

@ObjectType('InvoiceLineItem')
export class InvoiceLineItem {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  invoiceId!: string

  // null = custom line item
  @Field(() => ProjectFeature, { nullable: true })
  feature?: ProjectFeature

  @Field(() => String)
  description!: string

  @Field(() => Number)
  quantity!: number

  @Field(() => Number)
  unitPrice!: number

  @Field(() => Number)
  total!: number

  @Field(() => Int)
  sortOrder!: number
}

@ObjectType('Invoice')
export class Invoice {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  projectId!: string

  @Field(() => ID)
  clientId!: string

  @Field(() => String)
  invoiceNumber!: string

  @Field(() => InvoiceStatus)
  status!: InvoiceStatus

  @Field(() => Int, { nullable: true })
  depositPercent?: number

  // Computed from the post-discount totalAmount and depositPercent
  @Field(() => Number)
  depositAmount!: number

  @Field(() => String, { nullable: true })
  depositDueDate?: string

  @Field(() => String, { nullable: true })
  balanceDueDate?: string

  @Field(() => Number)
  subtotal!: number

  @Field(() => DiscountType, { nullable: true })
  discountType?: DiscountType

  @Field(() => Number, { nullable: true })
  discountValue?: number

  @Field(() => String, { nullable: true })
  discountLabel?: string

  @Field(() => Number, { nullable: true })
  discountAmount?: number

  @Field(() => Number)
  taxRate!: number

  @Field(() => Number)
  taxAmount!: number

  @Field(() => Number)
  totalAmount!: number

  @Field(() => Number)
  paidAmount!: number

  @Field(() => String, { nullable: true })
  notes?: string

  @Field(() => String, { nullable: true })
  paymentInstructions?: string

  @Field(() => String, { nullable: true })
  sentAt?: string

  @Field(() => String, { nullable: true })
  viewedAt?: string

  @Field(() => String, { nullable: true })
  paidAt?: string

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  updatedAt!: string

  @Field(() => [InvoiceLineItem])
  lineItems!: InvoiceLineItem[]
}

@InputType('InvoiceLineItemInput')
export class InvoiceLineItemInput {
  @Field(() => ProjectFeature, { nullable: true })
  feature?: ProjectFeature

  @Field(() => String)
  description!: string

  @Field(() => Number, { nullable: true })
  quantity?: number

  @Field(() => Number)
  unitPrice!: number
}

@InputType('CreateInvoiceInput')
export class CreateInvoiceInput {
  @Field(() => ID)
  projectId!: string

  // Omit to auto-populate from the project's features
  @Field(() => [InvoiceLineItemInput], { nullable: true })
  lineItems?: InvoiceLineItemInput[]

  @Field(() => Int, { nullable: true })
  depositPercent?: number

  @Field(() => String, { nullable: true })
  depositDueDate?: string

  @Field(() => String, { nullable: true })
  balanceDueDate?: string

  @Field(() => DiscountType, { nullable: true })
  discountType?: DiscountType

  @Field(() => Number, { nullable: true })
  discountValue?: number

  @Field(() => String, { nullable: true })
  discountLabel?: string

  @Field(() => Number, { nullable: true })
  taxRate?: number

  @Field(() => String, { nullable: true })
  notes?: string

  @Field(() => String, { nullable: true })
  paymentInstructions?: string
}

@InputType('UpdateInvoiceInput')
export class UpdateInvoiceInput {
  // Provided list replaces all existing line items
  @Field(() => [InvoiceLineItemInput], { nullable: true })
  lineItems?: InvoiceLineItemInput[]

  @Field(() => Int, { nullable: true })
  depositPercent?: number

  @Field(() => String, { nullable: true })
  depositDueDate?: string

  @Field(() => String, { nullable: true })
  balanceDueDate?: string

  // Explicit null clears the discount
  @Field(() => DiscountType, { nullable: true })
  discountType?: DiscountType | null

  @Field(() => Number, { nullable: true })
  discountValue?: number | null

  @Field(() => String, { nullable: true })
  discountLabel?: string | null

  @Field(() => Number, { nullable: true })
  taxRate?: number

  @Field(() => String, { nullable: true })
  notes?: string

  @Field(() => String, { nullable: true })
  paymentInstructions?: string
}

@ObjectType('InvoiceDashboardSummary')
export class InvoiceDashboardSummary {
  @Field(() => Number)
  outstandingAmount!: number

  @Field(() => Int)
  outstandingCount!: number

  @Field(() => Int)
  overdueCount!: number

  @Field(() => Number)
  paidThisMonthAmount!: number
}

@ObjectType('SuggestedInvoiceLineItem')
export class SuggestedInvoiceLineItem {
  @Field(() => ProjectFeature, { nullable: true })
  feature?: ProjectFeature

  @Field(() => String)
  description!: string

  @Field(() => Number)
  quantity!: number

  @Field(() => Number)
  unitPrice!: number
}
