import { NextResponse } from 'next/server'

import { contactSchema } from '@/validations'

// Mock contact API for testing - prevents real emails from being sent
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the request body (same validation as real API)
    const validation = contactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validation.data

    // Simulate a small delay like a real API would have
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Log the mock email for debugging (only in test environment)
    if (process.env.NODE_ENV === 'test') {
      console.warn('📧 MOCK EMAIL SENT:', {
        from: 'c0d3ster <support@c0d3ster.com>',
        to: ['support@c0d3ster.com'],
        subject: `New Contact Form: ${subject}`,
        replyTo: email,
        name,
        email,
        message,
      })
    }

    // Return success response (same as real API)
    return NextResponse.json(
      { message: 'Message sent successfully!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Mock contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
