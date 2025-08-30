import { Resend } from 'resend'

import type { ContactFormData } from '@/validations/ContactValidation'

import { BRAND_NAME, SUPPORT_EMAIL } from '@/constants'

import { ContactFormEmail } from './ContactFormEmail'

export async function sendContactFormEmail(data: ContactFormData) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: `${BRAND_NAME} <${SUPPORT_EMAIL}>`,
    to: [SUPPORT_EMAIL],
    subject: `New Contact Form: ${data.subject}`,
    react: ContactFormEmail({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    }) as React.ReactElement,
    replyTo: data.email,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { success: true }
}
