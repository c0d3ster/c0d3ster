import type { InvoiceLineItemRecord, InvoiceRecord } from '@/models'

type CheckoutMode = 'deposit' | 'balance'

type CheckoutLineItem = {
  name: string
  unitAmountCents: number
}

export const isCheckoutMode = (value: unknown): value is CheckoutMode =>
  value === 'deposit' || value === 'balance'

const toCents = (amount: number): number => Math.round(amount * 100)

// deposit = totalAmount * depositPercent; balance = totalAmount - paidAmount
export const calculateCheckoutCents = (
  { totalAmount, paidAmount, depositPercent }: Pick<
    InvoiceRecord,
    'totalAmount' | 'paidAmount' | 'depositPercent'
  >,
  mode: CheckoutMode
): number => {
  const totalCents = toCents(totalAmount)
  if (mode === 'balance') return Math.max(totalCents - toCents(paidAmount), 0)
  return Math.round((totalCents * (depositPercent ?? 0)) / 100)
}

// Splits `targetCents` across `weights` so the parts sum to exactly the target (largest remainder)
const allocate = (targetCents: number, weights: number[]): number[] => {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  if (weightSum === 0) return weights.map(() => 0)

  const exact = weights.map((weight) => (targetCents * weight) / weightSum)
  const parts = exact.map(Math.floor)
  let remainder = targetCents - parts.reduce((sum, part) => sum + part, 0)
  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
  for (const { index } of byFraction) {
    if (remainder <= 0) break
    parts[index] = (parts[index] ?? 0) + 1
    remainder -= 1
  }
  return parts
}

// Itemized lines (items + tax) whose sum is exactly amountCents. When the charge is the full
// pre-discount total the natural amounts are used; otherwise (deposit, partial balance, discount)
// the amounts are scaled proportionally, since Stripe can't take negative or partial lines.
export const buildCheckoutLineItems = (
  invoice: Pick<InvoiceRecord, 'taxAmount'>,
  lineItems: Pick<InvoiceLineItemRecord, 'description' | 'total'>[],
  amountCents: number,
  mode: CheckoutMode
): CheckoutLineItem[] => {
  const components = lineItems.map(({ description, total }) => ({
    name: description,
    cents: toCents(total),
  }))
  if (invoice.taxAmount > 0) {
    components.push({ name: 'Tax', cents: toCents(invoice.taxAmount) })
  }

  const naturalCents = components.reduce((sum, { cents }) => sum + cents, 0)
  const amounts =
    naturalCents === amountCents
      ? components.map(({ cents }) => cents)
      : allocate(
          amountCents,
          components.map(({ cents }) => cents)
        )
  const suffix = mode === 'deposit' ? ' (deposit)' : ' (balance)'

  return components
    .map(({ name }, index) => ({
      name: naturalCents === amountCents ? name : `${name}${suffix}`,
      unitAmountCents: amounts[index] ?? 0,
    }))
    .filter(({ unitAmountCents }) => unitAmountCents > 0)
}
