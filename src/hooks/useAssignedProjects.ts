import { useCallback, useEffect, useState } from 'react'

import type { ProjectItemType } from '@/types'

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
  const [projects, setProjects] = useState<AssignedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    // Wait for user data to load before making decisions
    if (userLoading) {
      return
    }

    if (!isDeveloper) {
      setProjects([])
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/developer/assigned-projects')

      if (!response.ok) {
        throw new Error(
          `Failed to fetch assigned projects: ${response.statusText}`
        )
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching assigned projects:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch assigned projects'
      )
    } finally {
      setIsLoading(false)
    }
  }, [isDeveloper, userLoading])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
  }
}
