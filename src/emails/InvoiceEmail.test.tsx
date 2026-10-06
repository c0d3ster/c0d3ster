import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { InvoiceEmail } from './InvoiceEmail'

describe('InvoiceEmail', () => {
  it('renders line items and a Pay Now link to the invoice page', () => {
    const html = renderToStaticMarkup(
      InvoiceEmail({
        clientName: 'Casey',
        invoiceNumber: 'INV-2026-001',
        projectName: 'Site',
        lineItems: [
          {
            description: 'Auth <setup>',
            quantity: 1,
            unitPrice: 500,
            total: 500,
          },
        ],
        subtotal: 500,
        taxAmount: 0,
        totalAmount: 500,
        invoiceUrl: 'https://example.com/invoices/abc',
      })
    )

    expect(html).toContain('INV-2026-001')
    expect(html).toContain('Auth &lt;setup&gt;')
    expect(html).toContain('$500.00')
    expect(html).toContain('href="https://example.com/invoices/abc"')
    expect(html).toContain('Pay Now')
  })
})
