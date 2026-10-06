'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  useGetInvoice,
  useMarkInvoiceViewed,
} from '@/apiClients/invoiceApiClient'
import { useGetMe } from '@/apiClients/userApiClient'
import { BRAND_NAME, SUPPORT_EMAIL } from '@/constants'
import { InvoiceStatus } from '@/graphql/generated/graphql'
import { formatCardDate } from '@/utils'
import { formatCurrency, isInvoicePayable } from '@/utils/Invoice'

import { InvoiceLineItemsTable } from './InvoiceLineItemsTable'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import { PayInvoiceButton } from './PayInvoiceButton'

type InvoiceDetailProps = {
  id: string
}

// The Stripe webhook can land a moment after the redirect back, so re-fetch
// for a short while until the paid amount moves.
const PAYMENT_POLL_MS = 2000
const PAYMENT_POLL_MAX_MS = 20000

export const InvoiceDetail = ({
  id,
}: InvoiceDetailProps): React.ReactElement => {
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment')
  const returnedFromStripe = paymentResult === 'success'
  const { data, loading, error, startPolling, stopPolling } = useGetInvoice(id)
  const { data: meData } = useGetMe()
  const [markViewed] = useMarkInvoiceViewed()
  const viewedRequested = useRef(false)
  const initialPaid = useRef<number | null>(null)

  const invoice = data?.getInvoice
  const status = invoice?.status
  const paidAmount = invoice?.paidAmount

  // First load of a sent invoice flips it to viewed
  useEffect(() => {
    if (status !== InvoiceStatus.Sent || viewedRequested.current) return
    viewedRequested.current = true
    markViewed({ variables: { id } }).catch(() => {
      viewedRequested.current = false
    })
  }, [status, id, markViewed])

  useEffect(() => {
    if (!returnedFromStripe || paidAmount === undefined) return
    initialPaid.current ??= paidAmount
    if (paidAmount > initialPaid.current) {
      stopPolling()
      return
    }
    startPolling(PAYMENT_POLL_MS)
    const timeout = setTimeout(stopPolling, PAYMENT_POLL_MAX_MS)
    return () => {
      clearTimeout(timeout)
      stopPolling()
    }
  }, [returnedFromStripe, paidAmount, startPolling, stopPolling])

  if (loading && !invoice) {
    return (
      <div className='py-20 text-center font-mono text-green-400/60'>
        Loading...
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className='py-20 text-center font-mono text-red-400/60'>
        Invoice not found.{' '}
        <Link
          href='/invoices'
          className='text-green-400 underline hover:text-green-300'
        >
          Back to invoices
        </Link>
      </div>
    )
  }

  const me = meData?.me
  const clientName =
    [me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.email
  const balance = Math.max(invoice.totalAmount - invoice.paidAmount, 0)
  const payable = isInvoicePayable(invoice.status) && balance > 0
  const depositAvailable =
    payable && invoice.paidAmount === 0 && invoice.depositAmount > 0

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      {returnedFromStripe && (
        <p className='rounded border border-green-400/40 bg-green-400/10 p-3 text-center font-mono text-sm text-green-300'>
          Thanks! Your payment is being confirmed.
        </p>
      )}
      {paymentResult === 'cancelled' && (
        <p className='rounded border border-yellow-400/40 bg-yellow-400/10 p-3 text-center font-mono text-sm text-yellow-300'>
          Payment cancelled. You have not been charged.
        </p>
      )}

      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='font-mono text-2xl font-bold text-green-400'>
            {invoice.invoiceNumber}
          </h1>
          <p className='mt-1 font-mono text-sm text-green-300/60'>
            Issued {formatCardDate(invoice.sentAt ?? invoice.createdAt)}
            {invoice.balanceDueDate &&
              ` · Due ${formatCardDate(invoice.balanceDueDate)}`}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className='grid grid-cols-2 gap-4 rounded-lg border border-green-400/20 bg-black/60 p-4 font-mono text-sm text-green-300'>
        <div>
          <p className='text-xs text-green-300/60 uppercase'>Billed to</p>
          <p>{clientName}</p>
          {me?.email && clientName !== me.email && <p>{me.email}</p>}
        </div>
        <div>
          <p className='text-xs text-green-300/60 uppercase'>From</p>
          <p>{BRAND_NAME}</p>
          <p>{SUPPORT_EMAIL}</p>
        </div>
      </div>

      <div className='rounded-lg border border-green-400/20 bg-black/60 p-4'>
        <InvoiceLineItemsTable lineItems={invoice.lineItems} />

        <dl className='mt-4 ml-auto max-w-xs space-y-1 font-mono text-sm text-green-300'>
          <div className='flex justify-between'>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(invoice.subtotal)}</dd>
          </div>
          {invoice.discountAmount ? (
            <div className='flex justify-between'>
              <dt>{invoice.discountLabel ?? 'Discount'}</dt>
              <dd>-{formatCurrency(invoice.discountAmount)}</dd>
            </div>
          ) : null}
          {invoice.taxAmount > 0 && (
            <div className='flex justify-between'>
              <dt>Tax ({(invoice.taxRate * 100).toFixed(2)}%)</dt>
              <dd>{formatCurrency(invoice.taxAmount)}</dd>
            </div>
          )}
          <div className='flex justify-between border-t border-green-400/20 pt-1 font-bold text-green-400'>
            <dt>Total due</dt>
            <dd>{formatCurrency(invoice.totalAmount)}</dd>
          </div>
        </dl>
      </div>

      <div className='space-y-3 rounded-lg border border-green-400/20 bg-black/60 p-4 font-mono text-sm text-green-300'>
        {depositAvailable && (
          <p>
            Deposit: {formatCurrency(invoice.depositAmount)}
            {invoice.depositDueDate &&
              `, due ${formatCardDate(invoice.depositDueDate)}`}
          </p>
        )}
        {invoice.paidAmount > 0 && (
          <p>Paid so far: {formatCurrency(invoice.paidAmount)}</p>
        )}
        <p>Remaining balance: {formatCurrency(balance)}</p>
        {invoice.paymentInstructions && (
          <p className='text-green-300/80'>{invoice.paymentInstructions}</p>
        )}
        {invoice.notes && <p className='text-green-300/80'>{invoice.notes}</p>}

        {payable && (
          <div className='flex flex-wrap gap-3 pt-2'>
            {depositAvailable && (
              <PayInvoiceButton
                invoiceId={invoice.id}
                mode='deposit'
                amount={invoice.depositAmount}
              />
            )}
            <PayInvoiceButton
              invoiceId={invoice.id}
              mode='balance'
              amount={balance}
            />
          </div>
        )}
      </div>

      <Link
        href='/invoices'
        className='inline-block font-mono text-sm text-green-400 underline hover:text-green-300'
      >
        Back to invoices
      </Link>
    </div>
  )
}
