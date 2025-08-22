import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'

import type { CurrentUser } from '@/services/api'

import { fetchCurrentUser } from '@/services/api'

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

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return false
      }
      return failureCount < 1
    },
  })

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isDeveloper = user?.role === 'developer'

  return {
    user: user || null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch()
    },
    isAdmin,
    isDeveloper,
  }
}
