import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContactSection } from './ContactSection'

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
})
