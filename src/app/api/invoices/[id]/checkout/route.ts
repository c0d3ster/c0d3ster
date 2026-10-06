import 'reflect-metadata'

import type { NextRequest } from 'next/server'

import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { InvoiceStatus } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { Env } from '@/libs/Env'
import {
  buildCheckoutLineItems,
  calculateCheckoutCents,
  isCheckoutMode,
} from '@/libs/invoiceCheckout'
import { logger } from '@/libs/Logger'
import { getStripe } from '@/libs/Stripe'
import { users } from '@/models'
import { invoiceService } from '@/services'

type RouteContext = { params: Promise<{ id: string }> }

const PAYABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.Sent,
  InvoiceStatus.Viewed,
  InvoiceStatus.PartiallyPaid,
  InvoiceStatus.Overdue,
]

const errorResponse = (error: string, status: number): NextResponse =>
  NextResponse.json({ error }, { status })

export const POST = async (
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> => {
  const { userId } = await auth()
  if (!userId) return errorResponse('Unauthorized', 401)

  const mode = request.nextUrl.searchParams.get('mode')
  if (!isCheckoutMode(mode)) {
    return errorResponse('mode must be "deposit" or "balance"', 400)
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })
    if (!user) return errorResponse('User not found', 404)

    const { id } = await params
    const invoice = await invoiceService.getInvoiceById(id)
    // Same response for missing and not-yours so invoice ids can't be probed
    if (!invoice || invoice.clientId !== user.id) {
      return errorResponse('Invoice not found', 404)
    }
    if (!PAYABLE_STATUSES.includes(invoice.status)) {
      return errorResponse(`Invoice is ${invoice.status} and cannot be paid`, 400)
    }
    if (mode === 'deposit') {
      if (!invoice.depositPercent) {
        return errorResponse('Invoice has no deposit', 400)
      }
      if (invoice.paidAmount > 0) {
        return errorResponse('Deposit has already been paid', 400)
      }
    }

    const amountCents = calculateCheckoutCents(invoice, mode)
    if (amountCents <= 0) {
      return errorResponse('Nothing left to pay on this invoice', 400)
    }

    const lineItems = buildCheckoutLineItems(
      invoice,
      invoice.lineItems,
      amountCents,
      mode
    )
    const baseUrl = Env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: lineItems.map(({ name, unitAmountCents }) => ({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: unitAmountCents,
          product_data: { name },
        },
      })),
      success_url: `${invoiceUrl}?payment=success`,
      cancel_url: `${invoiceUrl}?payment=cancelled`,
      metadata: { invoiceId: invoice.id, mode },
      payment_intent_data: { metadata: { invoiceId: invoice.id, mode } },
    })

    if (!session.url) {
      logger.error('Stripe checkout session has no url', {
        invoiceId: invoice.id,
      })
      return errorResponse('Failed to create checkout session', 500)
    }
    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error('Failed to create checkout session', { error })
    return errorResponse('Failed to create checkout session', 500)
  }
}
