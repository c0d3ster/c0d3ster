export const isAdminRole = (role: string | null | undefined): boolean => {
  // Handle both database values (lowercase) and GraphQL enum values (PascalCase)
  return (
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'Admin' ||
    role === 'SuperAdmin'
  )
}

export const isDeveloperOrHigherRole = (
  role: string | null | undefined
): boolean => {
  // Handle both database values (lowercase) and GraphQL enum values (PascalCase)
  return role === 'developer' || role === 'Developer' || isAdminRole(role)
}
