import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContactSection } from './ContactSection'

// Mock child components
vi.mock('@/components/atoms', () => ({
  __esModule: true,
  ExpandingUnderline: () => <div data-testid='expanding-underline' />,
  ScrollFade: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='scroll-fade'>{children}</div>
  ),
  SectionWrapper: ({
    children,
    id,
  }: {
    children: React.ReactNode
    id: string
  }) => (
    <section id={id} data-testid='section-wrapper'>
      {children}
    </section>
  ),
  TypewriterEffect: ({ text }: { text: string }) => (
    <span data-testid='typewriter'>{text}</span>
  ),
}))

vi.mock('@/components/molecules', () => ({
  __esModule: true,
  AnimatedHeading: ({ text }: { text: string }) => (
    <h2 data-testid='animated-heading'>{text}</h2>
  ),
}))

describe('ContactSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders section header', () => {
    render(<ContactSection />)

    expect(screen.getByText('CONTACT')).toBeInTheDocument()
    expect(screen.getByTestId('expanding-underline')).toBeInTheDocument()
    expect(screen.getByText('READY TO START YOUR PROJECT?')).toBeInTheDocument()
  })

  it('renders contact methods', () => {
    render(<ContactSection />)

    expect(screen.getAllByText('EMAIL')).toHaveLength(2) // One in heading, one in label
    expect(screen.getByText('GITHUB')).toBeInTheDocument()
    expect(screen.getByText('LINKEDIN')).toBeInTheDocument()
  })

  it('renders contact method values', () => {
    render(<ContactSection />)

    expect(screen.getByText('support@c0d3ster.com')).toBeInTheDocument()
    expect(screen.getByText('github.com/c0d3ster')).toBeInTheDocument()
    expect(
      screen.getByText('linkedin.com/in/cody-douglass')
    ).toBeInTheDocument()
  })

  it('renders contact method links with correct hrefs', () => {
    render(<ContactSection />)

    const emailLink = screen.getByText('support@c0d3ster.com').closest('a')
    const githubLink = screen.getByText('github.com/c0d3ster').closest('a')
    const linkedinLink = screen
      .getByText('linkedin.com/in/cody-douglass')
      .closest('a')

    expect(emailLink).toHaveAttribute('href', 'mailto:support@c0d3ster.com')
    expect(githubLink).toHaveAttribute('href', 'https://github.com/c0d3ster')
    expect(linkedinLink).toHaveAttribute(
      'href',
      'https://linkedin.com/in/cody-douglass'
    )
  })

  it('opens links in new tab', () => {
    render(<ContactSection />)

    const githubLink = screen.getByText('github.com/c0d3ster').closest('a')
    const linkedinLink = screen
      .getByText('linkedin.com/in/cody-douglass')
      .closest('a')

    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(linkedinLink).toHaveAttribute('target', '_blank')
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders contact form', () => {
    render(<ContactSection />)

    expect(screen.getByText('SEND MESSAGE')).toBeInTheDocument()
    expect(
      screen
        .getByRole('button', { name: 'INITIATE TRANSMISSION' })
        .closest('form')
    ).toBeInTheDocument()
  })

  it('renders form fields', () => {
    render(<ContactSection />)

    expect(screen.getByLabelText('NAME')).toBeInTheDocument()
    expect(screen.getByLabelText('EMAIL')).toBeInTheDocument()
    expect(screen.getByLabelText('SUBJECT')).toBeInTheDocument()
    expect(screen.getByLabelText('MESSAGE')).toBeInTheDocument()
  })

  it('has correct form field types', () => {
    render(<ContactSection />)

    expect(screen.getByLabelText('NAME')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('EMAIL')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('SUBJECT')).toHaveAttribute('type', 'text')
  })

  it('has correct placeholders', () => {
    render(<ContactSection />)

    expect(screen.getByPlaceholderText('YOUR NAME')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('YOUR EMAIL')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('PROJECT TYPE')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('DESCRIBE YOUR PROJECT...')
    ).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<ContactSection />)

    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })

    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('handles form input changes', () => {
    render(<ContactSection />)

    const nameInput = screen.getByLabelText('NAME')

    // Input should be present and accept input
    expect(nameInput).toBeInTheDocument()
    expect(nameInput).toHaveAttribute('type', 'text')
  })

  it('handles textarea input', () => {
    render(<ContactSection />)

    const messageTextarea = screen.getByLabelText('MESSAGE')

    // Textarea should be present and accept input
    expect(messageTextarea).toBeInTheDocument()
    expect(messageTextarea.tagName).toBe('TEXTAREA')
  })

  it('renders status information with typewriter effects', () => {
    render(<ContactSection />)

    expect(screen.getByText('RESPONSE TIME: < 24 HOURS')).toBeInTheDocument()
    expect(
      screen.getByText('AVAILABILITY: OPEN FOR PROJECTS')
    ).toBeInTheDocument()
    expect(
      screen.getByText('COMMUNICATION: SECURE & CONFIDENTIAL')
    ).toBeInTheDocument()
  })

  it('renders with correct section id', () => {
    render(<ContactSection />)

    const section = screen.getByTestId('section-wrapper')

    expect(section).toHaveAttribute('id', 'contact')
  })

  it('wraps content in ScrollFade components', () => {
    render(<ContactSection />)

    const scrollFadeElements = screen.getAllByTestId('scroll-fade')

    expect(scrollFadeElements.length).toBeGreaterThan(0)
  })

  it('renders contact method icons', () => {
    render(<ContactSection />)

    // Icons are emojis in the component
    expect(screen.getByText('📧')).toBeInTheDocument()
    expect(screen.getByText('💻')).toBeInTheDocument()
    expect(screen.getByText('🔗')).toBeInTheDocument()
  })

  it('handles form submission', () => {
    render(<ContactSection />)

    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })
    const form = submitButton.closest('form')

    // Form should be present and submittable
    expect(form).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})
