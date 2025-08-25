import { gql } from 'graphql-tag'

import type {
  SubmitContactFormMutation,
  SubmitContactFormMutationVariables,
} from '@/graphql/generated/graphql'

import {
  SubmitContactFormDocument,
  useSubmitContactFormMutation,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const SUBMIT_CONTACT_FORM = gql`
  mutation SubmitContactForm($input: ContactFormInput!) {
    submitContactForm(input: $input) {
      id
      name
      email
      subject
      message
      submittedAt
    }
  }
`

// Hooks for components
export const useSubmitContactForm = () => useSubmitContactFormMutation()

// Async functions for SSR / non-hook usage
export const submitContactForm = async (
  input: SubmitContactFormMutationVariables['input']
) => {
  const result = await apolloClient.mutate<
    SubmitContactFormMutation,
    SubmitContactFormMutationVariables
  >({
    mutation: SubmitContactFormDocument,
    variables: { input },
  })
  if (!result.data)
    throw new Error('No data returned from SubmitContactForm mutation')
  return result.data.submitContactForm
}
