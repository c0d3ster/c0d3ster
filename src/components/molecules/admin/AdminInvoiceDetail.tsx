'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useCancelInvoice, useGetInvoice, useSendInvoice } from '@/apiClients'
import { InvoiceStatus } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'
import { formatCardDate } from '@/utils'
import { formatCurrency, isInvoiceOverdue } from '@/utils/Invoice'

import { InvoiceLineItemsTable } from '../invoice/InvoiceLineItemsTable'
import { InvoiceStatusBadge } from '../invoice/InvoiceStatusBadge'
import { CreateInvoiceForm } from './CreateInvoiceForm'

type AdminInvoiceDetailProps = {
  id: string
  editing?: boolean
}

const EDITABLE: InvoiceStatus[] = [InvoiceStatus.Draft, InvoiceStatus.Sent]
const CANCELLABLE: InvoiceStatus[] = [
  InvoiceStatus.Draft,
  InvoiceStatus.Sent,
  InvoiceStatus.Viewed,
  InvoiceStatus.PartiallyPaid,
]

const buttonClass =
  'rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black disabled:opacity-40'

export const AdminInvoiceDetail = ({
  id,
  editing = false,
}: AdminInvoiceDetailProps): React.ReactElement => {
  const { data, loading, error, refetch } = useGetInvoice(id)
  const [sendInvoice, { loading: sending }] = useSendInvoice()
  const [cancelInvoice, { loading: cancelling }] = useCancelInvoice()
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const invoice = data?.getInvoice

  if (loading && !data) {
    return (
      <div className='py-20 text-center font-mono text-green-400/60'>
        Loading...
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className='py-20 text-center font-mono text-red-400/60'>
        Could not load this invoice.
      </div>
    )
  }

  if (editing) {
    if (!EDITABLE.includes(invoice.status)) {
      return (
        <p className='py-20 text-center font-mono text-green-300/60'>
          This invoice can no longer be edited.
        </p>
      )
    }
    return <CreateInvoiceForm invoice={invoice} />
  }

  const run = async (
    action: () => Promise<unknown>,
    done: string
  ): Promise<void> => {
    try {
      await action()
      Toast.success(done)
      await refetch()
    } catch (err) {
      Toast.error('Invoice action failed')
      console.error('Invoice action error:', err)
    }
  }

  const handleCancel = async (): Promise<void> => {
    if (!confirmingCancel) {
      setConfirmingCancel(true)
      return
    }
    setConfirmingCancel(false)
    await run(() => cancelInvoice({ variables: { id } }), 'Invoice cancelled')
  }

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div className='flex items-start justify-between gap-4 rounded-lg border border-green-400/20 bg-black/60 p-4 font-mono text-sm text-green-300'>
        <div className='grid flex-1 grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-green-300/60 uppercase'>Client</p>
            <p>{invoice.clientName}</p>
            {invoice.clientEmail !== invoice.clientName && (
              <p>{invoice.clientEmail}</p>
            )}
            <p className='mt-2 text-xs text-green-300/60'>
              Created {formatCardDate(invoice.createdAt)}
            </p>
          </div>
          <div>
            <p className='text-xs text-green-300/60 uppercase'>Project</p>
            <p>{invoice.projectName}</p>
          </div>
        </div>
        <InvoiceStatusBadge
          status={invoice.status}
          overdue={isInvoiceOverdue(invoice)}
        />
      </div>

      <InvoiceLineItemsTable lineItems={invoice.lineItems} />

      <div className='space-y-1 text-right font-mono text-sm text-green-300'>
        <p>Subtotal: {formatCurrency(invoice.subtotal)}</p>
        {invoice.discountAmount ? (
          <p>
            {invoice.discountLabel ?? 'Discount'}: -
            {formatCurrency(invoice.discountAmount)}
          </p>
        ) : null}
        <p className='text-lg font-bold text-green-400'>
          Total: {formatCurrency(invoice.totalAmount)}
        </p>
        <p>Paid: {formatCurrency(invoice.paidAmount)}</p>
      </div>

      <div className='flex flex-wrap gap-2'>
        {EDITABLE.includes(invoice.status) && (
          <Link href={`/dashboard/invoices/${id}/edit`} className={buttonClass}>
            EDIT
          </Link>
        )}
        {invoice.status === InvoiceStatus.Draft && (
          <button
            type='button'
            className={buttonClass}
            disabled={sending}
            onClick={() =>
              run(() => sendInvoice({ variables: { id } }), 'Invoice sent')
            }
          >
            SEND TO CLIENT
          </button>
        )}
        {CANCELLABLE.includes(invoice.status) && (
          <button
            type='button'
            className={buttonClass}
            disabled={cancelling}
            onClick={handleCancel}
          >
            {confirmingCancel ? 'CONFIRM CANCEL' : 'CANCEL INVOICE'}
          </button>
        )}
      </div>
    </div>
  )
}
