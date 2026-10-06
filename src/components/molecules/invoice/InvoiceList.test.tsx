import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetMyInvoices } from '@/apiClients/invoiceApiClient'
import { InvoiceStatus } from '@/graphql/generated/graphql'

import { InvoiceList } from './InvoiceList'

vi.mock('@/apiClients/invoiceApiClient', () => ({
  useGetMyInvoices: vi.fn(),
}))

describe('InvoiceList', () => {
  it('lists invoices with status and link to the detail page', () => {
    vi.mocked(useGetMyInvoices).mockReturnValue({
      data: {
        getMyInvoices: [
          {
            id: 'inv-1',
            invoiceNumber: 'INV-2026-001',
            status: InvoiceStatus.PartiallyPaid,
            totalAmount: 900,
            paidAmount: 450,
            sentAt: '2026-01-02T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      loading: false,
      error: undefined,
    } as never)
    render(<InvoiceList />)

    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
    expect(screen.getByText('partially paid')).toBeInTheDocument()
    expect(screen.getByText('$900.00')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/invoices/inv-1')
  })

  it('shows an empty state', () => {
    vi.mocked(useGetMyInvoices).mockReturnValue({
      data: { getMyInvoices: [] },
      loading: false,
      error: undefined,
    } as never)
    render(<InvoiceList />)

    expect(screen.getByText('No invoices yet.')).toBeInTheDocument()
  })
})
