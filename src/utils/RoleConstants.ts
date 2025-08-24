/**
 * Shared role constants and utilities that work on both client and server
 * No database imports - pure logic only
 */

export type UserRole = 'client' | 'developer' | 'admin' | 'super_admin'

// Canonical list + runtime guard
export const USER_ROLES = [
  'client',
  'developer',
  'admin',
  'super_admin',
] as const
export const isUserRole = (role: string | null | undefined): role is UserRole =>
  !!role && (USER_ROLES as readonly string[]).includes(role)

/**
 * Check if role string is admin or super_admin
 */
export const isAdminRole = (
  role: UserRole | null | undefined
): role is 'admin' | 'super_admin' => {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Check if role string is developer or higher (developer, admin, super_admin)
 */
export const isDeveloperOrHigherRole = (
  role: UserRole | null | undefined
): role is 'developer' | 'admin' | 'super_admin' => {
  return role === 'developer' || isAdminRole(role)
}

/**
 * Check if role string is client
 */
export const isClientRole = (
  role: UserRole | null | undefined
): role is 'client' => {
  return role === 'client'
}

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
      return 'Admin'
    case 'developer':
      return 'Developer'
    case 'client':
      return 'Client'
    default:
      return role
  }
}
