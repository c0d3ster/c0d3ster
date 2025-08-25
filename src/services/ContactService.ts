import { GraphQLError } from 'graphql'

import { sendContactFormEmail } from '@/emails'
import { logger } from '@/libs/Logger'

export class ContactService {
  async submitContactForm(input: any) {
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
      logger.error('Failed to submit contact form:', { error })
      throw new GraphQLError('Failed to submit contact form', {
        extensions: { code: 'CONTACT_FORM_ERROR' },
      })
    }
  }
}
