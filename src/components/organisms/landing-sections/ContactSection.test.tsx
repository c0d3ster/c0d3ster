import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { GITHUB_USERNAME, LINKEDIN_USERNAME, SUPPORT_EMAIL } from '@/constants'

import { ContactSection } from './ContactSection'

// Mock ContactForm to avoid Apollo Client dependency
vi.mock('@/components/molecules/contact/ContactForm', () => ({
  ContactForm: () => <div data-testid="contact-form">Contact Form Mock</div>,
}))

describe('ContactSection', () => {
  it('renders section header', () => {
    render(<ContactSection />)

    expect(screen.getByText('CONTACT')).toBeInTheDocument()
    expect(screen.getByText('READY TO START YOUR PROJECT?')).toBeInTheDocument()
  })

  it('renders contact methods', () => {
    render(<ContactSection />)

    expect(screen.getByText('EMAIL')).toBeInTheDocument() // Only one since ContactForm is mocked
    expect(screen.getByText('GITHUB')).toBeInTheDocument()
    expect(screen.getByText('LINKEDIN')).toBeInTheDocument()
  })

  it('renders contact method values', () => {
    render(<ContactSection />)

    expect(screen.getByText(SUPPORT_EMAIL)).toBeInTheDocument()
    expect(
      screen.getByText(`github.com/${GITHUB_USERNAME}`)
    ).toBeInTheDocument()
    expect(
      screen.getByText(`linkedin.com/in/${LINKEDIN_USERNAME}`)
    ).toBeInTheDocument()
  })

  it('renders contact form', () => {
    render(<ContactSection />)

    expect(screen.getByTestId('contact-form')).toBeInTheDocument()
  })

  it('renders status information with typewriter effects', async () => {
    render(<ContactSection />)

    // Wait for TypewriterEffect texts to appear
    await waitFor(
      () => {
        expect(
          screen.getByText('RESPONSE TIME: < 24 HOURS')
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(
      () => {
        expect(
          screen.getByText('AVAILABILITY: OPEN FOR PROJECTS')
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    await waitFor(
      () => {
        expect(
          screen.getByText('COMMUNICATION: SECURE & CONFIDENTIAL')
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})
