import { useCallback, useEffect, useState } from 'react'

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
  const [projects, setProjects] = useState<AvailableProject[]>([])
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

      const response = await fetch('/api/developer/available-projects')

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`)
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching available projects:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to fetch projects'
      )
    } finally {
      setIsLoading(false)
    }
  }, [isDeveloper, userLoading])

  const assignToProject = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(
        `/api/developer/available-projects/${projectId}/assign`,
        {
          method: 'PATCH',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to assign to project: ${response.statusText}`)
      }

      const data = await response.json()

      // Remove the assigned project from available projects
      setProjects((prev) => prev.filter((p) => p.id !== projectId))

      return data
    } catch (error) {
      console.error('Error assigning to project:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    assignToProject,
  }
}
