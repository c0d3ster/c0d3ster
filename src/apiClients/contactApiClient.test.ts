import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apolloClient } from '@/libs/ApolloClient'

import {
  SUBMIT_CONTACT_FORM,
  submitContactForm,
  useSubmitContactForm,
} from './contactApiClient'

// Mock Apollo Client
vi.mock('@/libs/ApolloClient', () => ({
  apolloClient: {
    mutate: vi.fn(),
  },
}))

// Mock the generated GraphQL hooks
vi.mock('@/graphql/generated/graphql', () => ({
  useSubmitContactFormMutation: vi.fn(),
  SubmitContactFormDocument: 'SUBMIT_CONTACT_FORM_DOCUMENT',
}))

describe('Contact API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GraphQL Operations', () => {
    it('should define SUBMIT_CONTACT_FORM operation', () => {
      expect(SUBMIT_CONTACT_FORM).toBeDefined()
      expect(SUBMIT_CONTACT_FORM.definitions).toHaveLength(1)
      expect(SUBMIT_CONTACT_FORM.definitions[0]?.kind).toBe(
        'OperationDefinition'
      )
    })
  })

  describe('Hooks', () => {
    it('should export useSubmitContactForm hook', () => {
      expect(useSubmitContactForm).toBeDefined()
      expect(typeof useSubmitContactForm).toBe('function')
    })
  })

  describe('Async Functions', () => {
    describe('submitContactForm', () => {
      it('should successfully submit contact form', async () => {
        const mockInput = {
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'Test message',
        }

        const mockResponse = {
          data: {
            submitContactForm: {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com',
              subject: 'Test Subject',
              message: 'Test message',
              submittedAt: '2024-01-01T00:00:00Z',
            },
          },
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        const result = await submitContactForm(mockInput)

        expect(apolloClient.mutate).toHaveBeenCalledWith({
          mutation: 'SUBMIT_CONTACT_FORM_DOCUMENT',
          variables: { input: mockInput },
        })
        expect(result).toEqual(mockResponse.data.submitContactForm)
      })

      it('should throw error when no data is returned', async () => {
        const mockInput = {
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'Test message',
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue({ data: null })

        await expect(submitContactForm(mockInput)).rejects.toThrow(
          'No data returned from SubmitContactForm mutation'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const mockInput = {
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'Test message',
        }

        const error = new Error('Network error')
        vi.mocked(apolloClient.mutate).mockRejectedValue(error)

        await expect(submitContactForm(mockInput)).rejects.toThrow(
          'Network error'
        )
      })
    })
  })
})
