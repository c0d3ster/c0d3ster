import 'reflect-metadata'
import { GraphQLScalarType, Kind } from 'graphql'
import { buildSchema } from 'type-graphql'

import {
  contactService,
  fileService,
  projectRequestService,
  projectService,
  userService,
} from '@/services'

import { createContext } from './context'
import {
  ContactResolver,
  DashboardResolver,
  FileResolver,
  ProjectRequestResolver,
  ProjectResolver,
  UserResolver,
} from './resolvers'

// Create a JSON scalar
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value
  },
  parseValue(value) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return ast
    }
    return null
  },
})

// Build the schema using type-graphql with resolver classes and container for DI
export const schema = buildSchema({
  resolvers: [
    UserResolver,
    DashboardResolver,
    ProjectResolver,
    ProjectRequestResolver,
    ContactResolver,
    FileResolver,
  ],
  validate: false, // Disable validation for now, can be enabled later
  scalarsMap: [{ type: Object, scalar: JSONScalar }],
  container: {
    get(someClass) {
      // manually handle resolver + service construction
      if (someClass === UserResolver) return new UserResolver(userService)
      if (someClass === ProjectResolver)
        return new ProjectResolver(projectService, userService, fileService)
      if (someClass === ProjectRequestResolver)
        return new ProjectRequestResolver(projectRequestService, userService)
      if (someClass === FileResolver)
        return new FileResolver(fileService, projectService, userService)
      if (someClass === ContactResolver)
        return new ContactResolver(contactService)
      if (someClass === DashboardResolver)
        return new DashboardResolver(
          userService,
          projectService,
          projectRequestService
        )

      // fallback for resolvers without deps
      return new (someClass as any)()
    },
  },
})

export async function createSchema() {
  return schema
}

export { createContext }
