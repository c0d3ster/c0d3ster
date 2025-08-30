import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { gql } from 'graphql-tag'

import { resolvers } from '../resolvers'
import { contactSchema } from './contact'
import { fileSchema } from './files'
import { projectSchema } from './project'
import { projectRequestSchema } from './projectRequest'
import { sharedSchema } from './shared'
import { userSchema } from './user'

// Base schema with root types that will be extended
const baseSchema = gql`
  scalar JSON

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`

// Merge all the type definitions
export const typeDefs = mergeTypeDefs([
  baseSchema,
  sharedSchema,
  userSchema,
  projectSchema,
  projectRequestSchema,
  contactSchema,
  fileSchema,
])

// Create and export the executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})
