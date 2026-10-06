import { Resend } from 'resend'

import { BRAND_NAME, SUPPORT_EMAIL } from '@/constants'

import type { InvoiceEmailProps } from './InvoiceEmail'

import { InvoiceEmail } from './InvoiceEmail'

export type SendInvoiceEmailInput = InvoiceEmailProps & { to: string }

export const sendInvoiceEmail = async ({
  to,
  ...props
}: SendInvoiceEmailInput): Promise<{ success: true }> => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: `${BRAND_NAME} <${SUPPORT_EMAIL}>`,
    to: [to],
    subject: `Invoice ${props.invoiceNumber} from ${BRAND_NAME}`,
    react: InvoiceEmail(props),
    replyTo: SUPPORT_EMAIL,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { success: true }
}
