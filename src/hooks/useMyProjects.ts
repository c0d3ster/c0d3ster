'use client'

import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'

import type { ProjectItem } from '@/types'

import { fetchMyProjects } from '@/services/api'

type ProjectsSummary = {
  totalRequests: number
  totalProjects: number
  pendingRequests: number
  activeProjects: number
}

type UseMyProjectsReturn = {
  items: ProjectItem[]
  summary: ProjectsSummary
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export const useMyProjects = (): UseMyProjectsReturn => {
  const { isSignedIn } = useAuth()

  // Fetch projects and summary
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const response = await fetchMyProjects()
      // Return both items and summary for the query
      return response
    },
    enabled: isSignedIn,
    staleTime: 30000,
    select: (data) => {
      // Transform the response to include computed summary
      const items = data || []
      const summary: ProjectsSummary = {
        totalRequests: items.filter((item) => item.type === 'request').length,
        totalProjects: items.filter((item) => item.type === 'project').length,
        pendingRequests: items.filter(
          (item) =>
            item.type === 'request' &&
            ['requested', 'in_review'].includes(item.status)
        ).length,
        activeProjects: items.filter(
          (item) =>
            item.type === 'project' &&
            ['approved', 'in_progress', 'in_testing'].includes(item.status)
        ).length,
      }
      return { items, summary }
    },
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return false
      }
      return failureCount < 1
    },
  })

  return {
    items: data?.items || [],
    summary: data?.summary || {
      totalRequests: 0,
      totalProjects: 0,
      pendingRequests: 0,
      activeProjects: 0,
    },
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch()
    },
  }
}
