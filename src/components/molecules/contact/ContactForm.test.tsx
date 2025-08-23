import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ContactForm } from './ContactForm'

// Mock the Toast utility
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()

vi.mock('@/libs', () => ({
  Toast: {
    success: mockShowSuccess,
    error: mockShowError,
  },
}))

// Mock the Button component
vi.mock('@/components/atoms', () => ({
  Button: ({ children, type, disabled, ...props }: any) => (
    <button
      type={type}
      disabled={disabled}
      data-testid='submit-button'
      {...props}
    >
      {children}
    </button>
  ),
}))

describe('ContactForm', () => {
  it('renders all form fields', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText('NAME')).toBeInTheDocument()
    expect(screen.getByLabelText('EMAIL')).toBeInTheDocument()
    expect(screen.getByLabelText('SUBJECT')).toBeInTheDocument()
    expect(screen.getByLabelText('MESSAGE')).toBeInTheDocument()
  })

  it('renders submit button with correct text', () => {
    render(<ContactForm />)

    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })

    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveTextContent('INITIATE TRANSMISSION')
  })

  it('handles form submission successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('NAME'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('EMAIL'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('SUBJECT'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('MESSAGE'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Message sent successfully! I'll get back to you within 24 hours."
      )
    })

    // Check that form was reset
    expect(screen.getByLabelText('NAME')).toHaveValue('')
    expect(screen.getByLabelText('EMAIL')).toHaveValue('')
    expect(screen.getByLabelText('SUBJECT')).toHaveValue('')
    expect(screen.getByLabelText('MESSAGE')).toHaveValue('')
  })

  it('handles form submission error', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('NAME'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('EMAIL'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('SUBJECT'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('MESSAGE'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Server error')
    })
  })

  it('handles network error', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('NAME'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('EMAIL'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('SUBJECT'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('MESSAGE'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.'
      )
    })
  })

  it('shows loading state during submission', async () => {
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ message: 'Success' }),
              }),
            100
          )
        )
    )
    vi.stubGlobal('fetch', mockFetch)

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('NAME'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('EMAIL'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('SUBJECT'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('MESSAGE'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })
    fireEvent.click(submitButton)

    // Check loading state - wait for it to appear
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('SENDING...')
      expect(submitButton).toBeDisabled()
    })

    // Wait for completion
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('INITIATE TRANSMISSION')
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('displays validation errors', async () => {
    render(<ContactForm />)

    // Try to submit empty form
    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Please fix the following errors:')
      )
    })
  })

  it('has correct form structure and accessibility', () => {
    render(<ContactForm />)

    // Check that labels are properly associated with inputs
    const nameInput = screen.getByLabelText('NAME')
    const emailInput = screen.getByLabelText('EMAIL')
    const subjectInput = screen.getByLabelText('SUBJECT')
    const messageInput = screen.getByLabelText('MESSAGE')

    expect(nameInput).toHaveAttribute('type', 'text')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(subjectInput).toHaveAttribute('type', 'text')
    expect(messageInput).toHaveAttribute('rows', '4')
  })
})
