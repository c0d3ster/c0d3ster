import 'reflect-metadata'

import type { NextRequest } from 'next/server'
import type Stripe from 'stripe'

import { GraphQLError } from 'graphql'
import { NextResponse } from 'next/server'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import { getStripe } from '@/libs/Stripe'
import { invoiceService } from '@/services'

// Retrying can't fix a missing invoice or one that is already paid/cancelled
const isUnrecoverable = (error: unknown): boolean =>
  error instanceof GraphQLError &&
  (error.extensions.code === 'NOT_FOUND' ||
    error.extensions.code === 'INVALID_STATUS')

const handleCheckoutCompleted = async (
  session: Stripe.Checkout.Session
): Promise<void> => {
  const invoiceId = session.metadata?.invoiceId
  if (!invoiceId) {
    logger.warn('Stripe checkout session has no invoiceId metadata', {
      sessionId: session.id,
    })
    return
  }
  if (session.payment_status !== 'paid') {
    logger.info('Stripe checkout session not paid yet, ignoring', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    })
    return
  }

  const paymentIntent = session.payment_intent
  const result = await invoiceService.recordPayment({
    invoiceId,
    amount: (session.amount_total ?? 0) / 100,
    checkoutSessionId: session.id,
    paymentIntentId:
      typeof paymentIntent === 'string' ? paymentIntent : (paymentIntent?.id ?? null),
  })
  logger.info('Stripe payment processed', {
    invoiceId,
    sessionId: session.id,
    ...result,
  })
}

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const webhookSecret = Env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // The raw body is required: signature verification fails on re-serialized JSON
  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    logger.warn('Stripe webhook signature verification failed', { error })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  try {
    await handleCheckoutCompleted(event.data.object)
  } catch (error) {
    // A non-2xx makes Stripe retry, except for states a retry can't fix
    if (isUnrecoverable(error)) {
      logger.error('Stripe payment could not be applied to invoice', { error })
      return NextResponse.json({ received: true })
    }
    logger.error('Stripe webhook handler failed', { error })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
