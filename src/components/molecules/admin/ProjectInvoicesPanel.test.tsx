import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetProjectInvoices } from '@/apiClients'
import { InvoiceStatus } from '@/graphql/generated/graphql'

import { ProjectInvoicesPanel } from './ProjectInvoicesPanel'

vi.mock('@/apiClients', () => ({ useGetProjectInvoices: vi.fn() }))

describe('ProjectInvoicesPanel', () => {
  it('lists the project invoices and links to create a new one for the project', () => {
    vi.mocked(useGetProjectInvoices).mockReturnValue({
      loading: false,
      data: {
        getProjectInvoices: [
          {
            id: 'inv-1',
            invoiceNumber: 'INV-2026-001',
            status: InvoiceStatus.Sent,
            totalAmount: 900,
            paidAmount: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    } as never)
    render(<ProjectInvoicesPanel projectId='p-1' />)

    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
    expect(screen.getByText('$900.00')).toBeInTheDocument()
    expect(screen.getByText('+ NEW INVOICE')).toHaveAttribute(
      'href',
      '/dashboard/invoices/new?projectId=p-1'
    )
  })

  it('shows an empty state when the project has no invoices', () => {
    vi.mocked(useGetProjectInvoices).mockReturnValue({
      loading: false,
      data: { getProjectInvoices: [] },
    } as never)
    render(<ProjectInvoicesPanel projectId='p-1' />)

    expect(
      screen.getByText('No invoices for this project yet.')
    ).toBeInTheDocument()
  })
})
