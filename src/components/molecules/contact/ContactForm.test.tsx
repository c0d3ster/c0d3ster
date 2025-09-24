import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Toast } from '@/libs/Toast'

import { ContactForm } from './ContactForm'

// Mock only the API client that ContactForm actually uses
const mockUseSubmitContactForm = vi.fn()

vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useSubmitContactForm: () => mockUseSubmitContactForm(),
  }
})

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock behavior
    mockUseSubmitContactForm.mockReturnValue([
      vi.fn().mockResolvedValue({ data: { submitContactForm: { id: '1' } } }),
      { loading: false, error: null },
    ])
  })

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
      expect(Toast.success).toHaveBeenCalledWith(
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
    // Mock the mutation function to throw an error
    const mockMutation = vi.fn().mockRejectedValue(new Error('Server error'))
    mockUseSubmitContactForm.mockReturnValue([mockMutation, {} as any])

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
      expect(Toast.error).toHaveBeenCalledWith('Server error')
    })
  })

  it('handles network errors', async () => {
    // Mock the mutation function to throw a network error
    const mockMutation = vi
      .fn()
      .mockRejectedValue(
        new Error('Network error. Please check your connection and try again.')
      )
    mockUseSubmitContactForm.mockReturnValue([mockMutation, {} as any])

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
      expect(Toast.error).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.'
      )
    })
  })

  it('validates required fields', async () => {
    render(<ContactForm />)

    // Submit the form without filling it out
    const submitButton = screen.getByRole('button', {
      name: 'INITIATE TRANSMISSION',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(Toast.error).toHaveBeenCalledWith(
        'Please fix the following errors: Name is required, Invalid email address, Subject is required, Message must be at least 10 characters'
      )
    })
  })

  it('shows loading state during submission', async () => {
    // Mock the mutation function to never resolve (for loading state)
    const mockMutation = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
    mockUseSubmitContactForm.mockReturnValue([mockMutation, {} as any])

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

    // Check that button shows loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('TRANSMITTING...')
    })
  })
})
