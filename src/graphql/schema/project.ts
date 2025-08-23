import { gql } from '@apollo/client'

export const projectSchema = gql`
  # Project-related enums
  enum ProjectStatus {
    approved
    in_progress
    completed
    on_hold
    cancelled
  }

  enum ProjectType {
    web_development
    mobile_app
    ecommerce
    saas
    api_development
    ui_ux_design
    other
  }

  # Project type
  type Project {
    id: ID!
    title: String!
    description: String!
    projectType: ProjectType!
    budget: Float
    requirements: String
    techStack: [String!]
    status: ProjectStatus!
    progressPercentage: Int
    startDate: String
    endDate: String
    createdAt: String!
    updatedAt: String!

    # Relationships
    client: User!
    developer: User
  }

  # Project queries
  extend type Query {
    projects: [Project!]!
    project(id: ID!): Project
    myProjects: [Project!]!
    availableProjects: [Project!]!
    assignedProjects: [Project!]!
  }

  # Project mutations
  extend type Mutation {
    createProject(input: CreateProjectRequestInput!): Project!
    updateProject(id: ID!, input: CreateProjectRequestInput!): Project!
    assignProject(projectId: ID!, developerId: ID!): Project!
    updateProjectStatus(
      id: ID!
      status: ProjectStatus!
      progressPercentage: Int
    ): Project!
  }
`
