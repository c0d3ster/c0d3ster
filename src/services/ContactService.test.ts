import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendContactFormEmail } from '@/emails'
import { logger } from '@/libs/Logger'

import { ContactService } from './ContactService'

// Mock specific dependencies not covered by global setup
vi.mock('@/emails', () => ({
  sendContactFormEmail: vi.fn(),
}))

describe('ContactService', () => {
  let contactService: ContactService
  const mockSendContactFormEmail = vi.mocked(sendContactFormEmail)
  const mockLoggerError = vi.mocked(logger.error)

  beforeEach(() => {
    vi.clearAllMocks()
    contactService = new ContactService()
  })

  describe('submitContactForm', () => {
    const validInput = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'Test message content',
    }

    it('should successfully submit contact form', async () => {
      mockSendContactFormEmail.mockResolvedValue({ success: true })

      const result = await contactService.submitContactForm(validInput)

      expect(mockSendContactFormEmail).toHaveBeenCalledWith(validInput)
      expect(result).toEqual({
        id: expect.stringMatching(/^contact_\d+$/),
        name: validInput.name,
        email: validInput.email,
        subject: validInput.subject,
        message: validInput.message,
        submittedAt: expect.any(String),
      })
      expect(new Date(result.submittedAt)).toBeInstanceOf(Date)
    })

    it('should generate unique IDs for different submissions', async () => {
      mockSendContactFormEmail.mockResolvedValue({ success: true })

      const result1 = await contactService.submitContactForm(validInput)
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))
      const result2 = await contactService.submitContactForm(validInput)

      expect(result1.id).not.toBe(result2.id)
    })

    it('should handle email sending failure', async () => {
      const error = new Error('Email service unavailable')
      mockSendContactFormEmail.mockRejectedValue(error)

      await expect(
        contactService.submitContactForm(validInput)
      ).rejects.toThrow(GraphQLError)

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to submit contact form:',
        { error }
      )
    })

    it('should throw GraphQLError with correct extensions on failure', async () => {
      const error = new Error('Network error')
      mockSendContactFormEmail.mockRejectedValue(error)

      try {
        await contactService.submitContactForm(validInput)

        expect.fail('Should have thrown an error')
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(GraphQLError)
        expect((thrownError as GraphQLError).message).toBe(
          'Failed to submit contact form'
        )
        expect((thrownError as GraphQLError).extensions).toEqual({
          code: 'CONTACT_FORM_ERROR',
        })
      }
    })

    it('should handle empty input fields', async () => {
      const emptyInput = {
        name: '',
        email: '',
        subject: '',
        message: '',
      }
      mockSendContactFormEmail.mockResolvedValue({ success: true })

      const result = await contactService.submitContactForm(emptyInput)

      expect(mockSendContactFormEmail).toHaveBeenCalledWith(emptyInput)
      expect(result).toEqual({
        id: expect.stringMatching(/^contact_\d+$/),
        name: '',
        email: '',
        subject: '',
        message: '',
        submittedAt: expect.any(String),
      })
    })

    it('should handle special characters in input', async () => {
      const specialInput = {
        name: 'José María',
        email: 'test+tag@example.com',
        subject: 'Subject with "quotes" and \'apostrophes\'',
        message: 'Message with\nnewlines\tand\ttabs and émojis 🚀',
      }
      mockSendContactFormEmail.mockResolvedValue({ success: true })

      const result = await contactService.submitContactForm(specialInput)

      expect(mockSendContactFormEmail).toHaveBeenCalledWith(specialInput)
      expect(result).toEqual({
        id: expect.stringMatching(/^contact_\d+$/),
        name: specialInput.name,
        email: specialInput.email,
        subject: specialInput.subject,
        message: specialInput.message,
        submittedAt: expect.any(String),
      })
    })
  })
})
