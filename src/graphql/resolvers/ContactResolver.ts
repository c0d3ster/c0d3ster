import { Arg, Mutation, Resolver } from 'type-graphql'

import type { ContactService } from '@/services'

import {
  ContactFormInput,
  ContactFormSubmission,
} from '@/graphql/schema/contact'

@Resolver(() => ContactFormSubmission)
export class ContactResolver {
  constructor(private contactService: ContactService) {}

  @Mutation(() => ContactFormSubmission)
  async submitContactForm(
    @Arg('input', () => ContactFormInput) input: ContactFormInput
  ) {
    return await this.contactService.submitContactForm(input)
  }
}
