import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { ContactFormEmail } from '@/components/email'
import { contactFormSchema } from '@/validations'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the request body
    const validation = contactFormSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validation.data

    // Send email using Resend
    const { error } = await resend.emails.send({
      from: 'c0d3ster <support@c0d3ster.com>',
      to: ['support@c0d3ster.com'],
      subject: `New Contact Form: ${subject}`,
      react: ContactFormEmail({
        name,
        email,
        subject,
        message,
      }) as React.ReactElement,
      replyTo: email,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Message sent successfully!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
