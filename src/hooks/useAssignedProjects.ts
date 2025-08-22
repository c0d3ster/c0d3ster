import { useQuery } from '@tanstack/react-query'

import type { ProjectItemType } from '@/types'

import { fetchAssignedProjects } from '@/services/api'

import { useCurrentUser } from './useCurrentUser'

export type AssignedProject = {
  id: string
  title: string
  description: string
  projectType: string
  budget: string | null
  status: string
  priority: string
  progressPercentage: number | null
  startDate: string | null
  estimatedCompletionDate: string | null
  actualCompletionDate: string | null
  liveUrl: string | null
  stagingUrl: string | null
  repositoryUrl: string | null
  techStack: string[] | null
  createdAt: string
  updatedAt: string
  type: ProjectItemType.PROJECT
  userRole: 'developer'
  clientEmail: string
  clientFirstName: string | null
  clientLastName: string | null
}

export const useAssignedProjects = () => {
  const { isDeveloper, isLoading: userLoading } = useCurrentUser()

  // Only fetch when user is confirmed to be a developer
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assigned-projects'],
    queryFn: fetchAssignedProjects,
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

  return {
    projects,
    isLoading: userLoading || isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch()
    },
  }
}
