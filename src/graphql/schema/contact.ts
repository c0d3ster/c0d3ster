import { gql } from 'graphql-tag'

export const contactSchema = gql`
  # Contact form type
  type ContactFormSubmission {
    id: ID!
    name: String!
    email: String!
    subject: String!
    message: String!
    submittedAt: String!
  }

  # Contact form input types
  input ContactFormInput {
    name: String!
    email: String!
    subject: String!
    message: String!
  }

  # Contact form mutations
  extend type Mutation {
    submitContactForm(input: ContactFormInput!): ContactFormSubmission!
  }
`
