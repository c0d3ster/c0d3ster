import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PayInvoiceButton } from './PayInvoiceButton'

describe('PayInvoiceButton', () => {
  const assign = vi.fn()

  afterEach(() => {
    vi.unstubAllGlobals()
    assign.mockReset()
  })

  it('posts to the checkout route and redirects to the Stripe url', async () => {
    vi.stubGlobal('location', { assign })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.test/s1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<PayInvoiceButton invoiceId='inv-1' mode='deposit' amount={500} />)
    fireEvent.click(screen.getByRole('button', { name: /pay deposit \$500/i }))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://checkout.stripe.test/s1')
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/invoices/inv-1/checkout?mode=deposit',
      { method: 'POST' }
    )
  })

  it('shows the error and re-enables the button when checkout fails', async () => {
    vi.stubGlobal('location', { assign })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invoice is paid and cannot be paid' }),
      })
    )

    render(<PayInvoiceButton invoiceId='inv-1' mode='balance' amount={100} />)
    fireEvent.click(screen.getByRole('button'))

    expect(
      await screen.findByText('Invoice is paid and cannot be paid')
    ).toBeInTheDocument()
    expect(assign).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})
