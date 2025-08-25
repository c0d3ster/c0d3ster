import { ContactService } from '@/services'

const contactService = new ContactService()

export const contactResolvers = {
  Mutation: {
    submitContactForm: async (_: any, { input }: { input: any }) => {
      return await contactService.submitContactForm(input)
    },
  },
}
