import type { UserRole } from '@/utils'

export type CurrentUser = {
  id: string
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  const response = await fetch('/api/users')

  if (!response.ok) {
    throw new Error('Failed to fetch user data')
  }

  return response.json()
}
