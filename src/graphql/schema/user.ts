import { gql } from '@apollo/client'

export const userSchema = gql`
  # User-related enums
  enum UserRole {
    client
    developer
    admin
  }

  # User type
  type User {
    id: ID!
    clerkId: String!
    email: String!
    firstName: String
    lastName: String
    role: UserRole!
    bio: String
    skills: [String!]
    portfolio: String
    hourlyRate: Float
    availability: String
    createdAt: String!
    updatedAt: String!
  }

  # User input types
  input UpdateUserInput {
    firstName: String
    lastName: String
    bio: String
    skills: [String!]
    portfolio: String
    hourlyRate: Float
    availability: String
  }

  # User queries
  extend type Query {
    me: User
    user(id: ID!): User
    users: [User!]!
    myDashboard: UserDashboard!
  }

  # User mutations
  extend type Mutation {
    updateUser(id: ID!, input: UpdateUserInput!): User!
  }
`
