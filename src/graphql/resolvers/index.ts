import { mergeResolvers } from '@graphql-tools/merge'

import { contactResolvers } from './ContactResolver'
import { projectRequestResolvers } from './ProjectRequestResolver'
import { projectResolvers } from './ProjectResolver'
import { userResolvers } from './UserResolver'

// Merge all resolvers using @graphql-tools
export const resolvers = mergeResolvers([
  userResolvers,
  projectResolvers,
  projectRequestResolvers,
  contactResolvers,
])
