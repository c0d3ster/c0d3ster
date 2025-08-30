import type { ContactService } from '@/services'

export class ContactResolver {
  [key: string]: any

  constructor(private contactService: ContactService) {}

  Mutation = {
    submitContactForm: async (_: any, { input }: { input: any }) => {
      return await this.contactService.submitContactForm(input)
    },
  }
}
