import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGetInvoice } from '@/apiClients/invoiceApiClient'

import { InvoicesHeader } from './InvoicesHeader'

const mockPathname = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ usePathname: mockPathname }))
vi.mock('@/apiClients/invoiceApiClient', () => ({ useGetInvoice: vi.fn() }))

describe('InvoicesHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGetInvoice).mockReturnValue({
      data: { getInvoice: { invoiceNumber: 'INV-2026-001' } },
    } as never)
  })

  it('shows INVOICES on the list and skips the invoice query', () => {
    mockPathname.mockReturnValue('/dashboard/invoices')
    render(<InvoicesHeader />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'INVOICES' })
    ).toBeInTheDocument()
    expect(useGetInvoice).toHaveBeenCalledWith('', true)
  })

  it('shows NEW INVOICE on the new invoice route', () => {
    mockPathname.mockReturnValue('/dashboard/invoices/new')
    render(<InvoicesHeader />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'NEW INVOICE' })
    ).toBeInTheDocument()
    expect(useGetInvoice).toHaveBeenCalledWith('', true)
  })

  it.each(['/dashboard/invoices/inv-1', '/dashboard/invoices/inv-1/edit'])(
    'shows the invoice number on %s',
    (path) => {
      mockPathname.mockReturnValue(path)
      render(<InvoicesHeader />)

      expect(
        screen.getByRole('heading', { level: 1, name: 'INV-2026-001' })
      ).toBeInTheDocument()
      expect(useGetInvoice).toHaveBeenCalledWith('inv-1', false)
    }
  )

  it('falls back to INVOICE while the invoice is loading', () => {
    mockPathname.mockReturnValue('/dashboard/invoices/inv-1')
    vi.mocked(useGetInvoice).mockReturnValue({ data: undefined } as never)
    render(<InvoicesHeader />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'INVOICE' })
    ).toBeInTheDocument()
  })
})
