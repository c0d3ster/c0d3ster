import { gql } from 'graphql-tag'

export const fileSchema = gql`
  type File {
    id: ID!
    key: String!
    fileName: String!
    originalFileName: String!
    fileType: FileType!
    fileSize: Int!
    contentType: String!
    uploadedBy: User
    projectId: ID
    project: Project
    environment: Environment!
    uploadedAt: String!
    downloadUrl: String
  }

  enum FileType {
    DESIGN
    DOCUMENT
    IMAGE
    VIDEO
    CODE
    OTHER
  }

  enum Environment {
    DEV
    PROD
  }

  input FileUploadInput {
    fileName: String!
    originalFileName: String!
    fileType: FileType!
    fileSize: Int!
    contentType: String!
    projectId: ID
    environment: Environment
  }

  input FileFilterInput {
    projectId: ID
    userId: ID
    fileType: FileType
    environment: Environment
  }

  extend type Query {
    files(filter: FileFilterInput): [File!]!
    file(key: String!): File
    projectFiles(projectId: ID!): [File!]!
    userFiles(userId: ID!): [File!]!
  }

  extend type Mutation {
    generateFileUploadUrl(input: FileUploadInput!): FileUploadResult!
    deleteFile(key: String!): Boolean!
  }

  type FileUploadResult {
    uploadUrl: String!
    key: String!
    metadata: File!
  }
`
