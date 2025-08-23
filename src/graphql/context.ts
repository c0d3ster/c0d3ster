import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { schemas } from '@/models'

export type GraphQLContext = {
  userId?: string
  user?: any
  db: typeof db
  schemas: typeof schemas
}

export async function createContext(): Promise<GraphQLContext> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { db, schemas }
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(schemas.users.clerkId, userId),
    })

    return {
      userId,
      user,
      db,
      schemas,
    }
  } catch (error) {
    console.error('Error creating GraphQL context:', error)
    return { db, schemas }
  }
}
