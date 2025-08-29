import type { NextRequest } from 'next/server'

import { graphql } from 'graphql'
import { NextResponse } from 'next/server'

import { createContext } from '@/graphql/context'
import { schema } from '@/graphql/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (
      !body ||
      typeof body.query !== 'string' ||
      body.query.trim().length === 0
    ) {
      return NextResponse.json(
        { errors: [{ message: 'query must be a non-empty string' }] },
        { status: 400 }
      )
    }
    const { query, variables, operationName } = body

    const context = await createContext()

    // Execute the query using the executable schema
    const result = await graphql({
      schema,
      source: query,
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
