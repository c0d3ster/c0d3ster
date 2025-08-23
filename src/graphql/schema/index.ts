import { gql } from '@apollo/client'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'

import { resolvers } from '../resolvers'
import { contactSchema } from './contact'
import { projectSchema } from './project'
import { projectRequestSchema } from './projectRequest'
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
  userSchema,
  projectSchema,
  projectRequestSchema,
  contactSchema,
])

// Create and export the executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})
