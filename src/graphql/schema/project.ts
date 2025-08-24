import { gql } from 'graphql-tag'

export const projectSchema = gql`
  # Project-related enums
  enum ProjectStatus {
    requested
    in_review
    approved
    in_progress
    in_testing
    ready_for_launch
    live
    completed
    on_hold
    cancelled
  }

  enum ProjectType {
    website
    web_app
    mobile_app
    e_commerce
    api
    maintenance
    consultation
    other
  }

  # Project type
  type Project {
    id: ID!
    title: String!
    description: String!
    projectType: ProjectType!
    budget: Float
    requirements: JSON
    techStack: [String!]
    status: ProjectStatus!
    progressPercentage: Int
    startDate: String
    estimatedCompletionDate: String
    actualCompletionDate: String
    createdAt: String!
    updatedAt: String!

    # Relationships
    client: User!
    developer: User
    projectRequest: ProjectRequest
    statusUpdates: [ProjectStatusUpdate!]!
    collaborators: [ProjectCollaborator!]!
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
    projectRequests: [ProjectRequest!]!
    summary: ProjectSummary!
  }

  # Project status update type
  type ProjectStatusUpdate {
    id: ID!
    projectId: ID!
    oldStatus: ProjectStatus
    newStatus: ProjectStatus!
    progressPercentage: Int
    updateMessage: String!
    isClientVisible: Boolean!
    createdAt: String!
    updatedBy: User!
  }

  # Project collaborator type
  type ProjectCollaborator {
    id: ID!
    projectId: ID!
    role: String!
    joinedAt: String!
    user: User!
  }

  # Project input types
  input CreateProjectInput {
    title: String!
    description: String!
    projectType: ProjectType!
    budget: Float
    requirements: JSON
    techStack: [String!]
    status: ProjectStatus!
    progressPercentage: Int
    startDate: String
    estimatedCompletionDate: String
    actualCompletionDate: String
  }

  input UpdateProjectInput {
    title: String
    description: String
    projectType: ProjectType
    budget: Float
    requirements: JSON
    techStack: [String!]
    status: ProjectStatus
    progressPercentage: Int
    startDate: String
    estimatedCompletionDate: String
    actualCompletionDate: String
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
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    assignProject(projectId: ID!, developerId: ID!): Project!
    updateProjectStatus(
      id: ID!
      status: ProjectStatus!
      progressPercentage: Int
    ): Project!
  }
`
