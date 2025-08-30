import { gql } from 'graphql-tag'

export const userSchema = gql`
  # User-related enums
  enum UserRole {
    client
    developer
    admin
    super_admin
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

  # Project summary types
  type ProjectSummary {
    totalProjects: Int!
    activeProjects: Int!
    completedProjects: Int!
    pendingRequests: Int!
  }

  type UserDashboard {
    projects: [Project!]!
    projectRequests: [ProjectRequestDisplay!]!
    summary: ProjectSummary!
    availableProjects: [Project!]!
    assignedProjects: [Project!]!
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
