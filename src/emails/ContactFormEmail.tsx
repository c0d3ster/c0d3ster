import * as React from 'react'

import { WEBSITE_URL } from '@/constants'

type ContactFormEmailProps = {
  name: string
  email: string
  subject: string
  message: string
}

export function ContactFormEmail({
  name,
  email,
  subject,
  message,
}: ContactFormEmailProps) {
  return (
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
        New Contact Form Submission
      </h1>

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>
          Contact Details:
        </h3>
        <p>
          <strong>Name:</strong> {name}
        </p>
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Subject:</strong> {subject}
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>Message:</h3>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            borderLeft: '4px solid #16a34a',
          }}
        >
          {message}
        </div>
      </div>

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
        <p>This email was sent from your website contact form.</p>
        <p>Sent via {WEBSITE_URL} contact form</p>
      </div>
    </div>
  )
}
