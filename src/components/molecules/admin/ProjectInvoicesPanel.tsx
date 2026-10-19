'use client'

import Link from 'next/link'

import { useGetProjectInvoices } from '@/apiClients'
import { formatCardDate } from '@/utils'
import { formatCurrency, isInvoiceOverdue } from '@/utils/Invoice'

import { InvoiceStatusBadge } from '../invoice/InvoiceStatusBadge'

type ProjectInvoicesPanelProps = {
  projectId: string
}

export const ProjectInvoicesPanel = ({
  projectId,
}: ProjectInvoicesPanelProps): React.ReactElement => {
  const { data, loading, error } = useGetProjectInvoices(projectId)
  const invoices = data?.getProjectInvoices ?? []

  return (
    <div className='space-y-3 rounded-lg border border-green-400/20 bg-black/40 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='font-mono text-xl font-bold text-green-400'>INVOICES</h3>
        <Link
          href={`/dashboard/invoices/new?projectId=${projectId}`}
          className='rounded border border-green-400 bg-green-400 px-3 py-1 font-mono text-xs font-bold text-black'
        >
          + NEW INVOICE
        </Link>
      </div>

      {loading && !data && (
        <p className='font-mono text-sm text-green-400/60'>Loading...</p>
      )}
      {error && (
        <p className='font-mono text-sm text-red-400/60'>
          Could not load invoices.
        </p>
      )}
      {!loading && !error && invoices.length === 0 && (
        <p className='font-mono text-sm text-green-300/60'>
          No invoices for this project yet.
        </p>
      )}

      <ul className='space-y-2'>
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              href={`/dashboard/invoices/${invoice.id}`}
              className='flex items-center justify-between gap-4 rounded border border-green-400/20 bg-black/60 p-3 transition-colors hover:border-green-400/60'
            >
              <div>
                <p className='font-mono text-sm font-bold text-green-400'>
                  {invoice.invoiceNumber}
                </p>
                <p className='font-mono text-xs text-green-300/60'>
                  {formatCardDate(invoice.sentAt ?? invoice.createdAt)}
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='font-mono text-sm text-green-300'>
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
