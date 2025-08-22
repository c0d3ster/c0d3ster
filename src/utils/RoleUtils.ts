import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { users } from '@/models/Schema'

export type UserRole = 'client' | 'developer' | 'admin' | 'super_admin'

export type AuthenticatedUser = {
  id: string
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
}

/**
 * Get the current authenticated user with role information
 */
export const getCurrentUser = async (): Promise<AuthenticatedUser | null> => {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return null
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
  }
}

/**
 * Check if user has admin privileges (admin or super_admin)
 */
export const isAdmin = (user: AuthenticatedUser | null): boolean => {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

/**
 * Check if user has super admin privileges
 */
export const isSuperAdmin = (user: AuthenticatedUser | null): boolean => {
  return user?.role === 'super_admin'
}

/**
 * Check if user is a developer
 */
export const isDeveloper = (user: AuthenticatedUser | null): boolean => {
  return user?.role === 'developer'
}

/**
 * Check if user has developer-level access or higher (developer, admin, super_admin)
 */
export const isDeveloperOrHigher = (
  user: AuthenticatedUser | null
): boolean => {
  return user?.role === 'developer' || isAdmin(user)
}

/**
 * Check if user has at least the specified role level
 */
export const hasRoleLevel = (
  user: AuthenticatedUser | null,
  minimumRole: UserRole
): boolean => {
  if (!user) return false

  const roleHierarchy: Record<UserRole, number> = {
    client: 1,
    developer: 2,
    admin: 3,
    super_admin: 4,
  }

  return roleHierarchy[user.role] >= roleHierarchy[minimumRole]
}

/**
 * Middleware helper to require admin access
 */
export const requireAdmin = async (): Promise<AuthenticatedUser> => {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!isAdmin(user)) {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Middleware helper to require authenticated user
 */
export const requireAuth = async (): Promise<AuthenticatedUser> => {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
