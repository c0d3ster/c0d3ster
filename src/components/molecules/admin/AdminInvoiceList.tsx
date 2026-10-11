'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useGetAllInvoices } from '@/apiClients'
import { InvoiceStatus } from '@/graphql/generated/graphql'
import { formatCardDate } from '@/utils'
import { formatCurrency, isInvoiceOverdue } from '@/utils/Invoice'

import { InvoiceStatusBadge } from '../invoice/InvoiceStatusBadge'

type InvoiceFilter = { label: string; status?: InvoiceStatus; overdue?: boolean }

const FILTERS: InvoiceFilter[] = [
  { label: 'ALL' },
  { label: 'DRAFT', status: InvoiceStatus.Draft },
  { label: 'SENT', status: InvoiceStatus.Sent },
  { label: 'OVERDUE', overdue: true },
  { label: 'PAID', status: InvoiceStatus.Paid },
]

export const AdminInvoiceList = (): React.ReactElement => {
  const [filter, setFilter] = useState<InvoiceFilter>(FILTERS[0] ?? { label: 'ALL' })
  const { data, loading, error } = useGetAllInvoices(
    filter.status,
    filter.overdue
  )
  const invoices = data?.getAllInvoices ?? []

  return (
    <div className='mx-auto max-w-3xl space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          {FILTERS.map((option) => (
            <button
              key={option.label}
              type='button'
              onClick={() => setFilter(option)}
              className={`rounded border px-3 py-1 font-mono text-xs font-bold transition-all duration-300 ${
                filter.label === option.label
                  ? 'border-green-400 bg-green-400 text-black'
                  : 'border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400 hover:text-black'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Link
          href='/admin/invoices/new'
          className='rounded border border-green-400 bg-green-400 px-3 py-1 font-mono text-xs font-bold text-black'
        >
          + NEW INVOICE
        </Link>
      </div>

      {loading && !data && (
        <p className='py-12 text-center font-mono text-green-400/60'>
          Loading...
        </p>
      )}
      {error && (
        <p className='py-12 text-center font-mono text-red-400/60'>
          Could not load invoices.
        </p>
      )}
      {!loading && !error && invoices.length === 0 && (
        <p className='py-12 text-center font-mono text-green-300/60'>
          No invoices found.
        </p>
      )}

      <ul className='space-y-3'>
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              href={`/admin/invoices/${invoice.id}`}
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
                <InvoiceStatusBadge
                  status={invoice.status}
                  overdue={isInvoiceOverdue(invoice)}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
