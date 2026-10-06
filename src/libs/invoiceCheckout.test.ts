import { describe, expect, it } from 'vitest'

import {
  buildCheckoutLineItems,
  calculateCheckoutCents,
  isCheckoutMode,
} from './invoiceCheckout'

const sum = (items: { unitAmountCents: number }[]): number =>
  items.reduce((total, { unitAmountCents }) => total + unitAmountCents, 0)

describe('isCheckoutMode', () => {
  it('accepts only deposit and balance', () => {
    expect(isCheckoutMode('deposit')).toBe(true)
    expect(isCheckoutMode('balance')).toBe(true)
    expect(isCheckoutMode('full')).toBe(false)
    expect(isCheckoutMode(null)).toBe(false)
  })
})

describe('calculateCheckoutCents', () => {
  const invoice = { totalAmount: 1000, paidAmount: 0, depositPercent: 25 }

  it('charges the deposit percent of the total', () => {
    expect(calculateCheckoutCents(invoice, 'deposit')).toBe(25000)
  })

  it('charges the unpaid remainder for balance', () => {
    expect(calculateCheckoutCents(invoice, 'balance')).toBe(100000)
    expect(
      calculateCheckoutCents({ ...invoice, paidAmount: 250 }, 'balance')
    ).toBe(75000)
  })

  it('never goes negative', () => {
    expect(
      calculateCheckoutCents({ ...invoice, paidAmount: 1200 }, 'balance')
    ).toBe(0)
  })
})

describe('buildCheckoutLineItems', () => {
  const items = [
    { description: 'Database', total: 100 },
    { description: 'Auth', total: 50.5 },
  ]

  it('uses natural amounts when charging the full total', () => {
    const result = buildCheckoutLineItems({ taxAmount: 10 }, items, 16050, 'balance')

    expect(result).toEqual([
      { name: 'Database', unitAmountCents: 10000 },
      { name: 'Auth', unitAmountCents: 5050 },
      { name: 'Tax', unitAmountCents: 1000 },
    ])
  })

  it('splits a deposit across items so the sum is exact', () => {
    const result = buildCheckoutLineItems({ taxAmount: 0 }, items, 3333, 'deposit')

    expect(sum(result)).toBe(3333)
    expect(result.map(({ name }) => name)).toEqual([
      'Database (deposit)',
      'Auth (deposit)',
    ])
  })

  it('scales to a discounted total exactly', () => {
    const result = buildCheckoutLineItems({ taxAmount: 8 }, items, 12345, 'balance')

    expect(sum(result)).toBe(12345)
  })
})
