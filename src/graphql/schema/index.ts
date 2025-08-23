import { gql } from '@apollo/client'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'

import { resolvers } from '../resolvers'
import { contactSchema } from './contact'
import { projectSchema } from './project'
import { projectRequestSchema } from './projectRequest'
import { userSchema } from './user'

// Base schema with only base types and empty Query/Mutation
const baseSchema = gql`
  scalar JSON

  # Base Query and Mutation types that will be extended
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`

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
