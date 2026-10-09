import { registerEnumType } from 'type-graphql'

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
