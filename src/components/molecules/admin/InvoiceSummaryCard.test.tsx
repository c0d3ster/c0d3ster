import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useInvoiceDashboardSummary } from '@/apiClients'

import { InvoiceSummaryCard } from './InvoiceSummaryCard'

vi.mock('@/apiClients', () => ({ useInvoiceDashboardSummary: vi.fn() }))

describe('InvoiceSummaryCard', () => {
  it('shows outstanding, overdue and paid-this-month figures', () => {
    vi.mocked(useInvoiceDashboardSummary).mockReturnValue({
      data: {
        invoiceDashboardSummary: {
          outstandingAmount: 1250.5,
          outstandingCount: 3,
          overdueCount: 2,
          paidThisMonthAmount: 400,
        },
      },
    } as never)
    render(<InvoiceSummaryCard />)

    expect(screen.getByText('$1,250.50')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('$400.00')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/admin/invoices')
  })

  it('renders nothing when the summary is unavailable', () => {
    vi.mocked(useInvoiceDashboardSummary).mockReturnValue({
      data: undefined,
      error: new Error('nope'),
    } as never)
    const { container } = render(<InvoiceSummaryCard />)

    expect(container).toBeEmptyDOMElement()
  })
})
