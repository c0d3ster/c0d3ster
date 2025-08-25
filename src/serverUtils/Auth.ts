import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'
import { schemas } from '@/models'
import { isAdminRole, isDeveloperOrHigherRole } from '@/utils'

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
  if (!user || typeof user.role !== 'string' || user.role.length === 0) {
    throw new GraphQLError('Forbidden', {
      extensions: { code: 'FORBIDDEN', reason: 'MISSING_OR_INVALID_ROLE' },
    })
  }
  const userRole = user.role

  if (requiredRole === 'admin') {
    if (!isAdminRole(userRole)) {
      throw new GraphQLError('Admin permissions required', {
        extensions: { code: 'FORBIDDEN' },
      })
    }
  } else if (requiredRole === 'developer') {
    if (!isDeveloperOrHigherRole(userRole)) {
      throw new GraphQLError('Developer permissions required', {
        extensions: { code: 'FORBIDDEN' },
      })
    }
  } else {
    // For specific role checks (client, etc.)
    // Allow users with higher roles to access lower role permissions
    if (userRole !== requiredRole && !isAdminRole(userRole)) {
      // Check if user has a higher role than required
      const roleHierarchy = ['client', 'developer', 'admin', 'super_admin']
      const userRoleIndex = roleHierarchy.indexOf(userRole)
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)

      if (userRoleIndex < requiredRoleIndex) {
        throw new GraphQLError(`${requiredRole} permissions required`, {
          extensions: { code: 'FORBIDDEN' },
        })
      }
    }
  }
}
