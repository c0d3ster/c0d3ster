import { DiscountType, InvoiceStatus } from '@/graphql/generated/graphql'

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

type PreviewTotalsInput = {
  lineItems: ReadonlyArray<{ quantity: number; unitPrice: number }>
  discountType?: DiscountType | null
  discountValue?: number | null
}

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

// Display-only estimate for the admin form preview (no tax, which the form
// does not collect). The server's calculateInvoiceTotals is authoritative.
export const calculatePreviewTotals = ({
  lineItems,
  discountType,
  discountValue,
}: PreviewTotalsInput): {
  subtotal: number
  discount: number
  total: number
} => {
  const subtotal = round2(
    lineItems.reduce(
      (sum, { quantity, unitPrice }) => sum + quantity * unitPrice,
      0
    )
  )
  const value = discountValue ?? 0
  const raw =
    discountType === DiscountType.Percentage
      ? (subtotal * value) / 100
      : discountType === DiscountType.Flat
        ? value
        : 0
  const discount = round2(Math.min(Math.max(raw, 0), subtotal))
  return { subtotal, discount, total: round2(subtotal - discount) }
}

export const newLineItemKey = (): string => crypto.randomUUID()
