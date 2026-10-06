import { InvoiceStatus } from '@/graphql/generated/graphql'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const formatCurrency = (amount: number): string =>
  currencyFormatter.format(amount)

const PAYABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.Sent,
  InvoiceStatus.Viewed,
  InvoiceStatus.PartiallyPaid,
  InvoiceStatus.Overdue,
]

// Mirrors the statuses the checkout route accepts
export const isInvoicePayable = (status: InvoiceStatus): boolean =>
  PAYABLE_STATUSES.includes(status)
