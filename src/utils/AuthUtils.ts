import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'
import { schemas } from '@/models'

// Helper function to get current user
export const getCurrentUser = async () => {
  const { userId } = await auth()
  if (!userId) {
    throw new GraphQLError('Unauthorized', {
      extensions: { code: 'UNAUTHORIZED' },
    })
  }

  const user = await db.query.users.findFirst({
    where: eq(schemas.users.clerkId, userId),
  })

  if (!user) {
    throw new GraphQLError('User not found', {
      extensions: { code: 'USER_NOT_FOUND' },
    })
  }

  return user
}

// Helper function to check permissions
export const checkPermission = (user: any, requiredRole: string) => {
  if (user.role !== requiredRole && user.role !== 'super_admin') {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    })
  }
}
