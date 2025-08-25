import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { schemas } from '@/models'

export type GraphQLContext = {
  userId?: string
  user?: typeof schemas.users.$inferSelect | null
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

    if (!user) {
      // Optional: warn so we can fix onboarding/data sync issues
      // logger.warn('Authenticated Clerk user not found in DB', { clerkId: userId })
      return { db, schemas }
    }

    return { userId, user, db, schemas }
  } catch (error) {
    console.error('Error creating GraphQL context:', error)
    return { db, schemas }
  }
}
