import { gql } from '@apollo/client'

import { contactSchema } from './contact'
import { projectSchema } from './project'
import { projectRequestSchema } from './projectRequest'
import { userSchema } from './user'

// Base schema for shared types / inputs
const baseSchema = gql`
  scalar JSON

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

  input ContactFormInput {
    name: String!
    email: String!
    subject: String!
    message: String!
  }
`

// Combine all schemas into a single typeDefs
export const typeDefs = gql`
  ${baseSchema}
  ${userSchema}
  ${projectSchema}
  ${projectRequestSchema}
  ${contactSchema}
`

// Export individually if needed
export {
  baseSchema,
  contactSchema,
  projectRequestSchema,
  projectSchema,
  userSchema,
}
