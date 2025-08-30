import { gql } from 'graphql-tag'

export const projectRequestSchema = gql`
  # Project request display type (subset for cards/lists)
  type ProjectRequestDisplay {
    id: ID!
    projectName: String!
    title: String
    description: String!
    projectType: ProjectType!
    budget: Float
    timeline: String
    requirements: JSON
    additionalInfo: String
    status: String!
    createdAt: String!
    user: DisplayUser!
  }

  # Project request type
  type ProjectRequest {
    id: ID!
    projectName: String!
    title: String
    description: String!
    projectType: ProjectType!
    budget: Float
    timeline: String
    requirements: JSON
    contactPreference: String
    additionalInfo: String
    status: String!
    createdAt: String!
    updatedAt: String!

    # Relationships
    user: DisplayUser!
    reviewer: DisplayUser
  }

  # Project request input types
  input CreateProjectRequestInput {
    projectName: String!
    title: String
    description: String!
    projectType: ProjectType!
    budget: Float
    timeline: String
    requirements: JSON
    contactPreference: String
    additionalInfo: String
  }

  # Project request queries test
  extend type Query {
    projectRequests: [ProjectRequestDisplay!]!
    projectRequest(id: ID!): ProjectRequest
  }

  # Project request mutations
  extend type Mutation {
    createProjectRequest(input: CreateProjectRequestInput!): ProjectRequest!
    updateProjectRequest(
      id: ID!
      input: CreateProjectRequestInput!
    ): ProjectRequest!
    approveProjectRequest(id: ID!): Project!
    rejectProjectRequest(id: ID!): ProjectRequest!
  }
`
