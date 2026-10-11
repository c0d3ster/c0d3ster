import { describe, expect, it } from 'vitest'

import { InvoiceStatus } from '@/graphql/generated/graphql'

import { isInvoiceOverdue } from './Invoice'

const now = new Date('2026-10-10T12:00:00.000Z')
const past = '2026-10-01T00:00:00.000Z'
const future = '2026-10-20T00:00:00.000Z'

describe('isInvoiceOverdue', () => {
  it.each([InvoiceStatus.Sent, InvoiceStatus.Viewed, InvoiceStatus.PartiallyPaid])(
    'is overdue when %s and past the balance due date',
    (status) => {
      expect(isInvoiceOverdue({ status, balanceDueDate: past }, now)).toBe(true)
    }
  )

  it('is not overdue before the balance due date', () => {
    expect(
      isInvoiceOverdue(
        { status: InvoiceStatus.Sent, balanceDueDate: future },
        now
      )
    ).toBe(false)
  })

  it('is not overdue without a balance due date', () => {
    expect(
      isInvoiceOverdue({ status: InvoiceStatus.Sent, balanceDueDate: null }, now)
    ).toBe(false)
  })

  it.each([InvoiceStatus.Draft, InvoiceStatus.Paid, InvoiceStatus.Cancelled])(
    'is never overdue when %s',
    (status) => {
      expect(isInvoiceOverdue({ status, balanceDueDate: past }, now)).toBe(
        false
      )
    }
  )
})
