import { GraphQLError } from 'graphql'

import type { ContactFormInput } from '@/graphql/schema'

import { sendContactFormEmail } from '@/emails'
import { logger } from '@/libs/Logger'

export class ContactService {
  async submitContactForm(input: ContactFormInput) {
    try {
      // Send email
      await sendContactFormEmail(input)

      // Return mock submission (in real app, you might save to DB)
      return {
        id: `contact_${Date.now()}`,
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        submittedAt: new Date().toISOString(),
      }
    } catch (error) {
      // Preserve the original error message and details
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      const errorDetails = error instanceof Error ? error.stack : String(error)

      // Enhanced logging with more context for debugging
      logger.error('Contact form submission failed:', {
        error: {
          message: errorMessage,
          stack: errorDetails,
          type: error?.constructor?.name || 'Unknown',
        },
        input: {
          name: input.name,
          email: input.email,
          subject: input.subject,
          messageLength: input.message?.length || 0,
        },
        timestamp: new Date().toISOString(),
      })

      throw new GraphQLError(`Failed to submit contact form: ${errorMessage}`, {
        extensions: {
          code: 'CONTACT_FORM_ERROR',
          originalError: errorMessage,
          details: errorDetails,
        },
      })
    }
  }
}
