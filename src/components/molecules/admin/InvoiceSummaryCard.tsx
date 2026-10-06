'use client'

import Link from 'next/link'

import { useInvoiceDashboardSummary } from '@/apiClients'
import { formatCurrency } from '@/utils/Invoice'

export const InvoiceSummaryCard = (): React.ReactElement | null => {
  const { data, error } = useInvoiceDashboardSummary()
  const summary = data?.invoiceDashboardSummary
  if (error || !summary) return null

  const stats = [
    { label: 'OUTSTANDING', value: formatCurrency(summary.outstandingAmount) },
    { label: 'OVERDUE', value: String(summary.overdueCount) },
    {
      label: 'PAID THIS MONTH',
      value: formatCurrency(summary.paidThisMonthAmount),
    },
  ]

  return (
    <Link
      href='/admin/invoices'
      className='mb-6 block rounded-lg border border-green-400/20 bg-black/60 p-4 transition-colors hover:border-green-400/60'
    >
      <p className='mb-3 font-mono text-xs font-bold text-green-300/60'>
        INVOICES
      </p>
      <div className='grid grid-cols-3 gap-4'>
        {stats.map(({ label, value }) => (
          <div key={label}>
            <p className='font-mono text-xs text-green-300/60'>{label}</p>
            <p className='font-mono text-xl font-bold text-green-400'>
              {value}
            </p>
          </div>
        ))}
      </div>
    </Link>
  )
}
