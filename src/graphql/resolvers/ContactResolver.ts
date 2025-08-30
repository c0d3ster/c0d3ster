import { services } from '@/services'

const { contactService } = services

export const contactResolvers = {
  Mutation: {
    submitContactForm: async (_: any, { input }: { input: any }) => {
      return await contactService.submitContactForm(input)
    },
  },
}
