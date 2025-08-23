import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { users } from '@/models'

export type UserRole = 'client' | 'developer' | 'admin' | 'super_admin'

type AuthenticatedUser = {
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
const getCurrentUser = async (): Promise<AuthenticatedUser | null> => {
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
const isAdmin = (user: AuthenticatedUser | null): boolean => {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

/**
 * Check if role string is admin or super_admin
 */
export const isAdminRole = (role: string): boolean => {
  return role === 'admin' || role === 'super_admin'
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
 * Check if role string is developer or higher (developer, admin, super_admin)
 */
export const isDeveloperOrHigherRole = (role: string): boolean => {
  return role === 'developer' || isAdminRole(role)
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
