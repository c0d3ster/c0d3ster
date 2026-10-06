'use client'

import Link from 'next/link'

import { useGetMyInvoices } from '@/apiClients/invoiceApiClient'
import { formatCardDate } from '@/utils'
import { formatCurrency } from '@/utils/Invoice'

import { InvoiceStatusBadge } from './InvoiceStatusBadge'

export const InvoiceList = (): React.ReactElement => {
  const { data, loading, error } = useGetMyInvoices()

  if (loading && !data) {
    return (
      <div className='py-20 text-center font-mono text-green-400/60'>
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className='py-20 text-center font-mono text-red-400/60'>
        Could not load your invoices.
      </div>
    )
  }

  const invoices = data?.getMyInvoices ?? []

  if (invoices.length === 0) {
    return (
      <div className='py-20 text-center font-mono text-green-300/60'>
        No invoices yet.
      </div>
    )
  }

  return (
    <ul className='mx-auto max-w-3xl space-y-3'>
      {invoices.map((invoice) => (
        <li key={invoice.id}>
          <Link
            href={`/invoices/${invoice.id}`}
            className='flex items-center justify-between gap-4 rounded-lg border border-green-400/20 bg-black/60 p-4 transition-colors hover:border-green-400/60'
          >
            <div>
              <p className='font-mono text-lg font-bold text-green-400'>
                {invoice.invoiceNumber}
              </p>
              <p className='font-mono text-xs text-green-300/60'>
                {formatCardDate(invoice.sentAt ?? invoice.createdAt)}
              </p>
            </div>
            <div className='flex items-center gap-4'>
              <span className='font-mono text-green-300'>
                {formatCurrency(invoice.totalAmount)}
              </span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
