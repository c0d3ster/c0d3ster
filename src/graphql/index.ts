import 'reflect-metadata'
import type { GraphQLSchema } from 'graphql'

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

// // --- Define a dummy class for JSON scalar mapping ---
// class JSONType {}

// // --- Custom JSON scalar ---
// const JSONScalar = new GraphQLScalarType({
//   name: 'JSON',
//   description: 'JSON custom scalar type',
//   serialize(value) {
//     return value
//   },
//   parseValue(value) {
//     return value
//   },
//   parseLiteral(ast) {
//     if (ast.kind === Kind.OBJECT) {
//       return ast
//     }
//     return null
//   },
// })

// --- Singleton schema caching (important for Next.js) ---
let schemaPromise: Promise<GraphQLSchema> | null = null

async function createSchema(): Promise<GraphQLSchema> {
  if (!schemaPromise) {
    schemaPromise = buildSchema({
      resolvers: [
        UserResolver,
        DashboardResolver,
        ProjectResolver,
        ProjectRequestResolver,
        ContactResolver,
        FileResolver,
      ],
      validate: false,
      // scalarsMap: [{ type: JSONType, scalar: JSONScalar }],
      container: {
        get(someClass) {
          if (someClass === UserResolver) return new UserResolver(userService)
          if (someClass === ProjectResolver)
            return new ProjectResolver(projectService, userService, fileService)
          if (someClass === ProjectRequestResolver)
            return new ProjectRequestResolver(
              projectRequestService,
              userService
            )
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
          return new (someClass as any)()
        },
      },
    })
  }
  return schemaPromise
}

export { createContext, createSchema }
