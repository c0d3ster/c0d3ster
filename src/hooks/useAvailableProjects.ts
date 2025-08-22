import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { assignToProject, fetchAvailableProjects } from '@/services/api'

import { useCurrentUser } from './useCurrentUser'

export type AvailableProject = {
  id: string
  title: string
  description: string
  projectType: string
  budget: string | null
  priority: string
  techStack: string[] | null
  repositoryUrl: string | null
  startDate: string | null
  estimatedCompletionDate: string | null
  createdAt: string
  updatedAt: string
  clientEmail: string
  clientFirstName: string | null
  clientLastName: string | null
}

export const useAvailableProjects = () => {
  const { isDeveloper, isLoading: userLoading } = useCurrentUser()
  const queryClient = useQueryClient()

  // Only fetch when user is confirmed to be a developer
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['available-projects'],
    queryFn: fetchAvailableProjects,
    enabled: !userLoading && isDeveloper,
    staleTime: 30000,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (
        error instanceof Error &&
        (error.message.includes('Unauthorized') ||
          error.message.includes('Access denied'))
      ) {
        return false
      }
      return failureCount < 1
    },
  })

  // Mutation for assigning to a project
  const assignMutation = useMutation({
    mutationFn: assignToProject,
    onSuccess: () => {
      // Invalidate multiple queries since assignment affects multiple lists
      queryClient.invalidateQueries({ queryKey: ['available-projects'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  return {
    projects,
    isLoading: userLoading || isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch()
    },
    assignToProject: assignMutation.mutateAsync,
  }
}
