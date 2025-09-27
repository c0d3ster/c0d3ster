import { beforeEach, describe, expect, it } from 'vitest'

import { ContactResolver } from '@/graphql/resolvers/ContactResolver'
import { createMockContactService } from '@/tests/mocks/services'

// Mock data factory for contact form submission
const createMockContactFormSubmission = (overrides = {}) => ({
  id: 'contact-1',
  name: 'Test User',
  email: 'test@example.com',
  message: 'Test message',
  submittedAt: new Date('2024-01-01'),
  ...overrides,
})

describe('ContactResolver', () => {
  let contactResolver: ContactResolver
  let mockContactService: ReturnType<typeof createMockContactService>

  beforeEach(() => {
    mockContactService = createMockContactService()
    contactResolver = new ContactResolver(mockContactService as any)
  })

  describe('submitContactForm', () => {
    it('should submit contact form successfully', async () => {
      const mockSubmission = createMockContactFormSubmission()
      const input = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      }

      mockContactService.submitContactForm.mockResolvedValue(mockSubmission)

      const result = await contactResolver.submitContactForm(input)

      expect(result).toEqual(mockSubmission)
      expect(mockContactService.submitContactForm).toHaveBeenCalledWith(input)
    })

    it('should handle service errors', async () => {
      const input = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      }

      const error = new Error('Service error')
      mockContactService.submitContactForm.mockRejectedValue(error)

      await expect(contactResolver.submitContactForm(input)).rejects.toThrow(
        'Service error'
      )
    })

    it('should pass through all input fields', async () => {
      const mockSubmission = createMockContactFormSubmission()
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message:
          'This is a detailed message with special characters: !@#$%^&*()',
        company: 'Test Company',
        phone: '123-456-7890',
      }

      mockContactService.submitContactForm.mockResolvedValue(mockSubmission)

      const result = await contactResolver.submitContactForm(input)

      expect(result).toEqual(mockSubmission)
      expect(mockContactService.submitContactForm).toHaveBeenCalledWith(input)
    })
  })
})
