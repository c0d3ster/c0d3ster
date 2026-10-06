import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useGetInvoice,
  useMarkInvoiceViewed,
} from '@/apiClients/invoiceApiClient'
import { useGetMe } from '@/apiClients/userApiClient'
import { InvoiceStatus } from '@/graphql/generated/graphql'

import { InvoiceDetail } from './InvoiceDetail'

vi.mock('@/apiClients/invoiceApiClient', () => ({
  useGetInvoice: vi.fn(),
  useMarkInvoiceViewed: vi.fn(),
}))
vi.mock('@/apiClients/userApiClient', () => ({ useGetMe: vi.fn() }))

const searchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}))

const markViewed = vi.fn()
const startPolling = vi.fn()
const stopPolling = vi.fn()

const baseInvoice = {
  id: 'inv-1',
  invoiceNumber: 'INV-2026-001',
  status: InvoiceStatus.Sent,
  depositPercent: 50,
  depositAmount: 450,
  depositDueDate: null,
  balanceDueDate: null,
  subtotal: 1000,
  discountLabel: 'Friends & Family Discount -10%',
  discountAmount: 100,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 900,
  paidAmount: 0,
  notes: null,
  paymentInstructions: null,
  sentAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  lineItems: [
    {
      id: 'li-1',
      description: 'Authentication',
      quantity: 1,
      unitPrice: 1000,
      total: 1000,
      sortOrder: 0,
    },
  ],
}

const mockInvoice = (overrides: Partial<typeof baseInvoice> = {}): void => {
  vi.mocked(useGetInvoice).mockReturnValue({
    data: { getInvoice: { ...baseInvoice, ...overrides } },
    loading: false,
    error: undefined,
    startPolling,
    stopPolling,
  } as never)
}

describe('InvoiceDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchParams.delete('payment')
    markViewed.mockResolvedValue({})
    vi.mocked(useMarkInvoiceViewed).mockReturnValue([markViewed] as never)
    vi.mocked(useGetMe).mockReturnValue({
      data: { me: { firstName: 'Casey', lastName: 'Client', email: 'c@x.io' } },
    } as never)
  })

  it('renders the itemized breakdown with the labeled discount', () => {
    mockInvoice()
    render(<InvoiceDetail id='inv-1' />)

    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
    expect(screen.getByText('Authentication')).toBeInTheDocument()
    expect(
      screen.getByText('Friends & Family Discount -10%')
    ).toBeInTheDocument()
    expect(screen.getByText('-$100.00')).toBeInTheDocument()
    expect(screen.getByText('Casey Client')).toBeInTheDocument()
  })

  it('marks a sent invoice as viewed on first load', () => {
    mockInvoice()
    render(<InvoiceDetail id='inv-1' />)

    expect(markViewed).toHaveBeenCalledWith({ variables: { id: 'inv-1' } })
  })

  it('does not mark an already viewed invoice again', () => {
    mockInvoice({ status: InvoiceStatus.Viewed })
    render(<InvoiceDetail id='inv-1' />)

    expect(markViewed).not.toHaveBeenCalled()
  })

  it('offers deposit and balance payment before anything is paid', () => {
    mockInvoice()
    render(<InvoiceDetail id='inv-1' />)

    expect(
      screen.getByRole('button', { name: /pay deposit \$450\.00/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /pay balance \$900\.00/i })
    ).toBeInTheDocument()
  })

  it('offers only the remaining balance after a deposit', () => {
    mockInvoice({ status: InvoiceStatus.PartiallyPaid, paidAmount: 450 })
    render(<InvoiceDetail id='inv-1' />)

    expect(screen.queryByText(/pay deposit/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /pay balance \$450\.00/i })
    ).toBeInTheDocument()
  })

  it('hides pay buttons when fully paid', () => {
    mockInvoice({ status: InvoiceStatus.Paid, paidAmount: 900 })
    render(<InvoiceDetail id='inv-1' />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('re-fetches by polling after returning from Stripe', () => {
    searchParams.set('payment', 'success')
    mockInvoice()
    render(<InvoiceDetail id='inv-1' />)

    expect(startPolling).toHaveBeenCalledWith(2000)
    expect(screen.getByText(/payment is being confirmed/i)).toBeInTheDocument()
  })

  it('shows not found when the invoice is missing', () => {
    vi.mocked(useGetInvoice).mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('NOT_FOUND'),
      startPolling,
      stopPolling,
    } as never)
    render(<InvoiceDetail id='nope' />)

    expect(screen.getByText(/invoice not found/i)).toBeInTheDocument()
  })
})
