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

  # Project display type (subset for cards/lists)
  type ProjectDisplay {
    id: ID!
    projectName: String!
    title: String
    overview: String
    description: String
    techStack: [String!]
    status: ProjectStatus!
    logo: String
    liveUrl: String
    repositoryUrl: String
    featured: Boolean!
    createdAt: String!
    projectType: ProjectType!
    budget: Float
  }

  # Project type
  type Project {
    id: ID!
    projectName: String!
    description: String!
    title: String
    overview: String
    projectType: ProjectType!
    budget: Float
    requirements: JSON
    techStack: [String!]
    status: ProjectStatus!
    progressPercentage: Int
    priority: String
    startDate: String
    estimatedCompletionDate: String
    actualCompletionDate: String
    repositoryUrl: String
    liveUrl: String
    stagingUrl: String
    featured: Boolean!
    logo: String
    createdAt: String!
    updatedAt: String!

    # Relationships - these will be resolved by field resolvers
    clientId: ID!
    developerId: ID
    requestId: ID

    # Resolved relationships (via field resolvers)
    client: DisplayUser!
    developer: DisplayUser
    projectRequest: ProjectRequest
    statusUpdates: [ProjectStatusUpdate!]!
    collaborators: [ProjectCollaborator!]!
  }

  # Project status update type
  type ProjectStatusUpdate {
    id: ID!
    projectId: ID
    oldStatus: ProjectStatus
    newStatus: ProjectStatus!
    progressPercentage: Int
    updateMessage: String!
    isClientVisible: Boolean!
    createdAt: String!
    updatedById: ID

    # Resolved relationships (via field resolvers)
    updatedBy: DisplayUser!
  }

  # Project collaborator type
  type ProjectCollaborator {
    id: ID!
    role: String!
    joinedAt: String!

    # Resolved relationships (via field resolvers)
    user: DisplayUser!
  }

  # Project input types
  input CreateProjectInput {
    title: String
    projectName: String!
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
    projectName: String
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
    featured: Boolean
  }

  input ProjectFilter {
    status: ProjectStatus
    projectType: ProjectType
    priority: String
    clientId: ID
    developerId: ID
  }

  # Project queries
  extend type Query {
    projects(filter: ProjectFilter, userEmail: String): [ProjectDisplay!]!
    project(id: ID!): Project
    projectBySlug(slug: String!): Project
    myProjects: [Project!]!
    availableProjects: [Project!]!
    assignedProjects: [Project!]!
    featuredProjects(userEmail: String): [ProjectDisplay!]!
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
