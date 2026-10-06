'use client'

import { useState } from 'react'

import { Button } from '@/components/atoms'
import { formatCurrency } from '@/utils/Invoice'

type PayMode = 'deposit' | 'balance'

type PayInvoiceButtonProps = {
  invoiceId: string
  mode: PayMode
  amount: number
}

type CheckoutResponse = {
  url?: string
  error?: string
}

const LABELS: Record<PayMode, string> = {
  deposit: 'PAY DEPOSIT',
  balance: 'PAY BALANCE',
}

export const PayInvoiceButton = ({
  invoiceId,
  mode,
  amount,
}: PayInvoiceButtonProps): React.ReactElement => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/checkout?mode=${mode}`,
        { method: 'POST' }
      )
      const body: CheckoutResponse = await response.json()
      if (!response.ok || !body.url) {
        setError(body.error ?? 'Could not start checkout. Please try again.')
        setLoading(false)
        return
      }
      window.location.assign(body.url)
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handlePay} disabled={loading}>
        {loading ? 'REDIRECTING...' : `${LABELS[mode]} ${formatCurrency(amount)}`}
      </Button>
      {error && <p className='mt-2 font-mono text-xs text-red-400'>{error}</p>}
    </div>
  )
}
