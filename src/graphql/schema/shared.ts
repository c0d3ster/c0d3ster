import { gql } from 'graphql-tag'

export const sharedSchema = gql`
  # Minimal user info for display purposes
  type DisplayUser {
    id: ID!
    firstName: String
    lastName: String
    email: String!
  }
`
