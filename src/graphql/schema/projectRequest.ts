import { gql } from 'graphql-tag'

export const projectRequestSchema = gql`
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
