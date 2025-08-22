import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

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

type UseCurrentUserReturn = {
  user: CurrentUser | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  isAdmin: boolean
  isDeveloper: boolean
}

export const useCurrentUser = (): UseCurrentUserReturn => {
  const { isSignedIn } = useAuth()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    if (!isSignedIn) {
      setUser(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users')

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await response.json()
      setUser(userData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching current user:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isDeveloper = user?.role === 'developer'

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
    isAdmin,
    isDeveloper,
  }
}
