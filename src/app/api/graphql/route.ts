import type { NextRequest } from 'next/server'

import { graphql } from 'graphql'
import { NextResponse } from 'next/server'

import { createContext } from '@/graphql/context'
import { resolvers } from '@/graphql/resolvers'
import { schema } from '@/graphql/schema'

export async function POST(request: NextRequest) {
  try {
    const { query, variables, operationName } = await request.json()

    const context = await createContext()

    // Execute the query using the executable schema
    const result = await graphql({
      schema,
      source: query,
      rootValue: resolvers,
      contextValue: context,
      variableValues: variables,
      operationName,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GraphQL Error:', error)
    return NextResponse.json(
      { errors: [{ message: 'Internal server error' }] },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GraphQL endpoint - use POST for queries',
  })
}
