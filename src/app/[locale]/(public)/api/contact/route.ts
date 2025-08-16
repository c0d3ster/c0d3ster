import { NextResponse } from 'next/server'

import { contactSchema } from '@/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the request body
    const validation = contactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validation.data

    // For now, we'll log the contact form submission
    // In production, you'd integrate with an email service like:
    // - Resend (resend.com)
    // - SendGrid
    // - Nodemailer with your own SMTP
    // - Vercel's built-in email functionality

    // eslint-disable-next-line no-console
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    })

    // TODO: Replace this with actual email sending logic
    // Example with a hypothetical email service:
    // await sendEmail({
    //   to: 'support@c0d3ster.com',
    //   from: 'noreply@c0d3ster.com',
    //   subject: `Contact Form: ${subject}`,
    //   text: `
    //     Name: ${name}
    //     Email: ${email}
    //     Subject: ${subject}
    //
    //     Message:
    //     ${message}
    //   `,
    // })

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
