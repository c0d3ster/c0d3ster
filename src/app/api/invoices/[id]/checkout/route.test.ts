import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvoiceStatus } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { getStripe } from '@/libs/Stripe'
import { invoiceService } from '@/services'

import { POST } from './route'

type LineItemParam = { price_data: { unit_amount: number } }

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/libs/Stripe', () => ({ getStripe: vi.fn() }))
vi.mock('@/libs/Env', () => ({
  Env: { NEXT_PUBLIC_APP_URL: 'https://example.test' },
}))
vi.mock('@/services', () => ({
  invoiceService: { getInvoiceById: vi.fn() },
}))
vi.mock('@/models', () => ({ users: { clerkId: 'clerkId' } }))

const create = vi.fn()

const invoice = {
  id: 'invoice-1',
  clientId: 'user-1',
  status: InvoiceStatus.Sent,
  depositPercent: 25,
  paidAmount: 0,
  taxAmount: 0,
  totalAmount: 1000,
  lineItems: [
    { description: 'Database', total: 600 },
    { description: 'Auth', total: 400 },
  ],
}

const call = (mode: string | null): Promise<Response> =>
  POST(
    new NextRequest(
      `http://localhost/api/invoices/invoice-1/checkout${mode ? `?mode=${mode}` : ''}`,
      { method: 'POST' }
    ),
    { params: Promise.resolve({ id: 'invoice-1' }) }
  )

const sessionParams = (): {
  line_items: (LineItemParam & { price_data: { product_data: { name: string } } })[]
} => create.mock.calls[0]?.[0]

const lineItems = (): LineItemParam[] => sessionParams().line_items

const chargedCents = (): number =>
  lineItems().reduce((total, item) => total + item.price_data.unit_amount, 0)

describe('POST /api/invoices/[id]/checkout', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-1' } as never)
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: 'user-1',
      email: 'client@example.com',
    } as never)
    vi.mocked(invoiceService.getInvoiceById).mockResolvedValue(invoice as never)
    vi.mocked(getStripe).mockReturnValue({
      checkout: { sessions: { create } },
    } as never)
    create.mockResolvedValue({ url: 'https://checkout.stripe.test/s1' })
  })

  it('requires authentication', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)

    expect((await call('deposit')).status).toBe(401)
  })

  it('rejects an invalid mode', async () => {
    expect((await call('full')).status).toBe(400)
    expect((await call(null)).status).toBe(400)
  })

  it('hides invoices owned by another client', async () => {
    vi.mocked(invoiceService.getInvoiceById).mockResolvedValue({
      ...invoice,
      clientId: 'someone-else',
    } as never)

    expect((await call('deposit')).status).toBe(404)
    expect(create).not.toHaveBeenCalled()
  })

  it.each([InvoiceStatus.Draft, InvoiceStatus.Paid, InvoiceStatus.Cancelled])(
    'refuses to charge a %s invoice',
    async (status) => {
      vi.mocked(invoiceService.getInvoiceById).mockResolvedValue({
        ...invoice,
        status,
      } as never)

      expect((await call('balance')).status).toBe(400)
      expect(create).not.toHaveBeenCalled()
    }
  )

  it('creates a deposit session for the deposit amount', async () => {
    const response = await call('deposit')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      url: 'https://checkout.stripe.test/s1',
    })
    expect(chargedCents()).toBe(25000)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        metadata: { invoiceId: 'invoice-1', mode: 'deposit' },
      })
    )
  })

  it('creates a balance session for the unpaid remainder, itemized', async () => {
    vi.mocked(invoiceService.getInvoiceById).mockResolvedValue({
      ...invoice,
      status: InvoiceStatus.PartiallyPaid,
      paidAmount: 250,
    } as never)

    const response = await call('balance')

    expect(response.status).toBe(200)
    expect(chargedCents()).toBe(75000)
    expect(lineItems()).toHaveLength(2)
  })

  it('charges the full total as natural line items when nothing is paid', async () => {
    await call('balance')

    expect(chargedCents()).toBe(100000)
    expect(sessionParams().line_items[0]?.price_data.product_data.name).toBe(
      'Database'
    )
  })

  it('refuses a second deposit', async () => {
    vi.mocked(invoiceService.getInvoiceById).mockResolvedValue({
      ...invoice,
      status: InvoiceStatus.PartiallyPaid,
      paidAmount: 250,
    } as never)

    expect((await call('deposit')).status).toBe(400)
  })

  it('refuses a deposit when the invoice has no deposit percent', async () => {
    vi.mocked(invoiceService.getInvoiceById).mockResolvedValue({
      ...invoice,
      depositPercent: null,
    } as never)

    expect((await call('deposit')).status).toBe(400)
  })

  it('returns 500 when Stripe is not configured', async () => {
    vi.mocked(getStripe).mockImplementation(() => {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    })

    expect((await call('deposit')).status).toBe(500)
  })
})
