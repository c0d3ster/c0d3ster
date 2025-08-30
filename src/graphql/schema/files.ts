import { gql } from 'graphql-tag'

export const fileSchema = gql`
  type File {
    id: ID!
    key: String!
    fileName: String!
    originalFileName: String!
    fileSize: Int!
    contentType: String!
    uploadedBy: User
    projectId: ID
    project: Project
    environment: Environment!
    uploadedAt: String!
    downloadUrl: String
  }

  enum Environment {
    DEV
    PROD
  }

  input FileUploadInput {
    fileName: String!
    originalFileName: String!
    fileSize: Int!
    contentType: String!
    projectId: ID
    environment: Environment
  }

  input FileFilterInput {
    projectId: ID
    userId: ID
    contentType: String
    environment: Environment
  }

  extend type Query {
    files(filter: FileFilterInput): [File!]!
    file(key: String!): File
    projectFiles(projectId: ID!): [File!]!
    userFiles(userId: ID!): [File!]!
  }

  extend type Mutation {
    uploadProjectLogo(
      projectId: ID!
      input: FileUploadInput!
    ): ProjectLogoUploadResult!
    generateFileDownloadUrl(key: String!): String!
    deleteFile(key: String!): Boolean!
  }

  type ProjectLogoUploadResult {
    uploadUrl: String!
    key: String!
    metadata: File!
    projectId: ID!
  }
`
