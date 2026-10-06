import { GraphQLError } from 'graphql'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvoiceStatus } from '@/graphql/schema'
import { invoiceService } from '@/services'

import { POST } from './route'

const WEBHOOK_SECRET = 'whsec_test_secret'

const mockEnv = vi.hoisted(() => ({
  STRIPE_SECRET_KEY: 'sk_test_123' as string | undefined,
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret' as string | undefined,
}))

vi.mock('@/libs/Env', () => ({ Env: mockEnv }))
vi.mock('@/services', () => ({
  invoiceService: { recordPayment: vi.fn() },
}))

const stripe = new Stripe('sk_test_123')

const completedEvent = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    id: 'evt_1',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        object: 'checkout.session',
        payment_status: 'paid',
        amount_total: 25000,
        payment_intent: 'pi_1',
        metadata: { invoiceId: 'invoice-1' },
        ...overrides,
      },
    },
  })

const buildRequest = (
  payload: string,
  signature: string | null = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  })
): NextRequest =>
  new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: payload,
    headers: signature ? { 'stripe-signature': signature } : {},
  })

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    mockEnv.STRIPE_SECRET_KEY = 'sk_test_123'
    mockEnv.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
    vi.mocked(invoiceService.recordPayment).mockResolvedValue({
      recorded: true,
      status: InvoiceStatus.PartiallyPaid,
    })
  })

  it('rejects an invalid signature without touching the invoice', async () => {
    const payload = completedEvent()
    const forged = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_wrong_secret',
    })

    const response = await POST(buildRequest(payload, forged))

    expect(response.status).toBe(400)
    expect(invoiceService.recordPayment).not.toHaveBeenCalled()
  })

  it('rejects a payload that was tampered with after signing', async () => {
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: completedEvent(),
      secret: WEBHOOK_SECRET,
    })

    const response = await POST(
      buildRequest(completedEvent({ amount_total: 999999 }), signature)
    )

    expect(response.status).toBe(400)
    expect(invoiceService.recordPayment).not.toHaveBeenCalled()
  })

  it('rejects a missing signature header', async () => {
    const response = await POST(buildRequest(completedEvent(), null))

    expect(response.status).toBe(400)
    expect(invoiceService.recordPayment).not.toHaveBeenCalled()
  })

  it('returns 500 when the webhook secret is not configured', async () => {
    mockEnv.STRIPE_WEBHOOK_SECRET = undefined

    const response = await POST(buildRequest(completedEvent()))

    expect(response.status).toBe(500)
    expect(invoiceService.recordPayment).not.toHaveBeenCalled()
  })

  it('records the payment for a valid checkout.session.completed', async () => {
    const response = await POST(buildRequest(completedEvent()))

    expect(response.status).toBe(200)
    expect(invoiceService.recordPayment).toHaveBeenCalledWith({
      invoiceId: 'invoice-1',
      amount: 250,
      checkoutSessionId: 'cs_1',
      paymentIntentId: 'pi_1',
    })
  })

  it('ignores sessions that are not paid', async () => {
    const response = await POST(
      buildRequest(completedEvent({ payment_status: 'unpaid' }))
    )

    expect(response.status).toBe(200)
    expect(invoiceService.recordPayment).not.toHaveBeenCalled()
  })

  it('ignores other event types', async () => {
    const payload = JSON.stringify({
      id: 'evt_2',
      object: 'event',
      type: 'charge.succeeded',
      data: { object: {} },
    })

    const response = await POST(buildRequest(payload))

    expect(response.status).toBe(200)
    expect(invoiceService.recordPayment).not.toHaveBeenCalled()
  })

  it('returns 500 on a transient failure so Stripe retries', async () => {
    vi.mocked(invoiceService.recordPayment).mockRejectedValue(
      new Error('db down')
    )

    const response = await POST(buildRequest(completedEvent()))

    expect(response.status).toBe(500)
  })

  it('returns 200 when the invoice state can never accept the payment', async () => {
    vi.mocked(invoiceService.recordPayment).mockRejectedValue(
      new GraphQLError('nope', { extensions: { code: 'INVALID_STATUS' } })
    )

    const response = await POST(buildRequest(completedEvent()))

    expect(response.status).toBe(200)
  })
})
