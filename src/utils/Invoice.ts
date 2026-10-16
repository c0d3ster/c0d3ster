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
]

// Mirrors the statuses the checkout route accepts
export const isInvoicePayable = (status: InvoiceStatus): boolean =>
  PAYABLE_STATUSES.includes(status)

// Overdue is not a stored status: an unpaid invoice past its balance due date is overdue
export const isInvoiceOverdue = (
  {
    status,
    balanceDueDate,
  }: { status: InvoiceStatus; balanceDueDate?: string | null },
  now: Date = new Date()
): boolean => {
  if (!balanceDueDate || !isInvoicePayable(status)) return false
  return new Date(balanceDueDate) < now
}
