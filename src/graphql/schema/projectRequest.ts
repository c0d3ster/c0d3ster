import { gql } from '@apollo/client'

export const projectRequestSchema = gql`
  # Project request input types
  input CreateProjectRequestInput {
    title: String!
    description: String!
    projectType: ProjectType!
    budget: Float
    timeline: String
    requirements: String
    contactPreference: String
    additionalInfo: String
  }

  # Project request type
  type ProjectRequest {
    id: ID!
    title: String!
    description: String!
    projectType: ProjectType!
    budget: Float
    timeline: String
    requirements: String
    contactPreference: String
    additionalInfo: String
    status: String!
    createdAt: String!
    updatedAt: String!

    # Relationships
    user: User!
  }

  # Project request queries
  extend type Query {
    projectRequests: [ProjectRequest!]!
    projectRequest(id: ID!): ProjectRequest
    myProjectRequests: [ProjectRequest!]!
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
