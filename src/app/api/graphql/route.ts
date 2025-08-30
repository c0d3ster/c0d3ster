import type { NextRequest } from 'next/server'

import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'

import { createContext } from '@/graphql/context'
import { schema } from '@/graphql/schema'

// Create Apollo Server instance
const server = new ApolloServer({
  schema,
  introspection: true, // Enable introspection for playground
  formatError: (error) => {
    // Log errors for debugging
    console.error('GraphQL Error:', error)

    // Return sanitized error in production
    if (process.env.NODE_ENV === 'production') {
      return {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      }
    }

    return error
  },
})

// Create and export the handler
export const GET = startServerAndCreateNextHandler(server, {
  context: async (_req: NextRequest) => {
    return await createContext()
  },
}) as any

export const POST = startServerAndCreateNextHandler(server, {
  context: async (_req: NextRequest) => {
    return await createContext()
  },
}) as any
