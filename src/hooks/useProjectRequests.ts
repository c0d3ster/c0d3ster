import { useAuth } from '@clerk/nextjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createProjectRequest, fetchUserProjectRequests } from '@/services/api'

export const useProjectRequests = () => {
  const { isSignedIn } = useAuth()
  const queryClient = useQueryClient()

  // Query for fetching user's project requests
  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project-requests'],
    queryFn: fetchUserProjectRequests,
    enabled: isSignedIn,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return false
      }
      return failureCount < 1
    },
  })

  // Mutation for creating a new project request
  const createMutation = useMutation({
    mutationFn: createProjectRequest,
    onSuccess: () => {
      // Invalidate and refetch project requests
      queryClient.invalidateQueries({ queryKey: ['project-requests'] })
      // Also invalidate my-projects since it includes project requests
      queryClient.invalidateQueries({ queryKey: ['my-projects'] })
    },
  })

  return {
    requests,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch()
    },
    createRequest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError:
      createMutation.error instanceof Error
        ? createMutation.error.message
        : null,
    isCreateSuccess: createMutation.isSuccess,
    resetCreate: createMutation.reset,
  }
}
