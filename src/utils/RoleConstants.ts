type UserRole = 'client' | 'developer' | 'admin' | 'super_admin'

export const isUserRole = (
  role: string | null | undefined
): role is UserRole => {
  const USER_ROLES = ['client', 'developer', 'admin', 'super_admin']
  return !!role && (USER_ROLES as readonly string[]).includes(role)
}

// Functions that are actually imported by other files
export const isAdminRole = (
  role: UserRole | null | undefined
): role is 'admin' | 'super_admin' => {
  return role === 'admin' || role === 'super_admin'
}

export const isDeveloperOrHigherRole = (
  role: UserRole | null | undefined
): role is 'developer' | 'admin' | 'super_admin' => {
  return role === 'developer' || isAdminRole(role)
}
