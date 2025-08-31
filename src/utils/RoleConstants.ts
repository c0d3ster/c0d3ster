export const isAdminRole = (role: string | null | undefined): boolean => {
  return role === 'admin' || role === 'super_admin'
}

export const isDeveloperOrHigherRole = (
  role: string | null | undefined
): boolean => {
  return role === 'developer' || isAdminRole(role)
}
