import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetAllInvoices } from '@/apiClients'
import { InvoiceStatus } from '@/graphql/generated/graphql'

import { AdminInvoiceList } from './AdminInvoiceList'

vi.mock('@/apiClients', () => ({ useGetAllInvoices: vi.fn() }))

describe('AdminInvoiceList', () => {
  it('lists invoices and re-queries with the chosen status filter', () => {
    vi.mocked(useGetAllInvoices).mockReturnValue({
      data: {
        getAllInvoices: [
          {
            id: 'inv-1',
            invoiceNumber: 'INV-2026-001',
            status: InvoiceStatus.Draft,
            totalAmount: 900,
            paidAmount: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      loading: false,
      error: undefined,
    } as never)
    render(<AdminInvoiceList />)

    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
    expect(useGetAllInvoices).toHaveBeenLastCalledWith(undefined)

    fireEvent.click(screen.getByRole('button', { name: 'OVERDUE' }))

    expect(useGetAllInvoices).toHaveBeenLastCalledWith(InvoiceStatus.Overdue)
  })
})
