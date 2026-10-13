import * as React from 'react'

import { WEBSITE_URL } from '@/constants'

export type InvoiceEmailLineItem = {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export type InvoiceEmailProps = {
  clientName: string
  invoiceNumber: string
  projectName: string
  lineItems: InvoiceEmailLineItem[]
  subtotal: number
  discountLabel?: string | null
  discountAmount?: number | null
  taxAmount: number
  totalAmount: number
  depositAmount?: number | null
  depositDueDate?: Date | null
  balanceDueDate?: Date | null
  notes?: string | null
  paymentInstructions?: string | null
  invoiceUrl: string
}

const formatMoney = (amount: number): string =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

const cell = { padding: '8px', borderBottom: '1px solid #e5e5e5' }

export const InvoiceEmail = ({
  clientName,
  invoiceNumber,
  projectName,
  lineItems,
  subtotal,
  discountLabel,
  discountAmount,
  taxAmount,
  totalAmount,
  depositAmount,
  depositDueDate,
  balanceDueDate,
  notes,
  paymentInstructions,
  invoiceUrl,
}: InvoiceEmailProps): React.ReactElement => (
  <div
    style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
    }}
  >
    <h1
      style={{
        color: '#16a34a',
        borderBottom: '2px solid #16a34a',
        paddingBottom: '10px',
      }}
    >
      Invoice {invoiceNumber}
    </h1>
    <p>Hi {clientName},</p>
    <p>
      Here is your invoice for <strong>{projectName}</strong>.
    </p>

    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ textAlign: 'left', backgroundColor: '#f5f5f5' }}>
          <th style={cell}>Item</th>
          <th style={{ ...cell, textAlign: 'right' }}>Qty</th>
          <th style={{ ...cell, textAlign: 'right' }}>Price</th>
          <th style={{ ...cell, textAlign: 'right' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {lineItems.map((item, index) => (
          <tr key={index}>
            <td style={cell}>{item.description}</td>
            <td style={{ ...cell, textAlign: 'right' }}>{item.quantity}</td>
            <td style={{ ...cell, textAlign: 'right' }}>
              {formatMoney(item.unitPrice)}
            </td>
            <td style={{ ...cell, textAlign: 'right' }}>
              {formatMoney(item.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ marginTop: '16px', textAlign: 'right' }}>
      <p>Subtotal: {formatMoney(subtotal)}</p>
      {discountAmount ? (
        <p>
          {discountLabel || 'Discount'}: -{formatMoney(discountAmount)}
        </p>
      ) : null}
      {taxAmount > 0 ? <p>Tax: {formatMoney(taxAmount)}</p> : null}
      <p style={{ fontSize: '18px' }}>
        <strong>Total: {formatMoney(totalAmount)}</strong>
      </p>
    </div>

    {depositAmount ? (
      <p>
        Deposit due: <strong>{formatMoney(depositAmount)}</strong>
        {depositDueDate ? ` by ${formatDate(depositDueDate)}` : ''}
      </p>
    ) : null}
    {balanceDueDate ? <p>Balance due by {formatDate(balanceDueDate)}</p> : null}

    <p style={{ textAlign: 'center', margin: '30px 0' }}>
      <a
        href={invoiceUrl}
        style={{
          backgroundColor: '#16a34a',
          color: '#ffffff',
          padding: '12px 28px',
          borderRadius: '5px',
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        Pay Now
      </a>
    </p>

    {notes ? (
      <p>
        <strong>Notes:</strong> {notes}
      </p>
    ) : null}
    {paymentInstructions ? (
      <p>
        <strong>Payment instructions:</strong> {paymentInstructions}
      </p>
    ) : null}

    <div
      style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '5px',
        fontSize: '12px',
        color: '#666',
      }}
    >
      <p>Sent via {WEBSITE_URL}</p>
    </div>
  </div>
)
