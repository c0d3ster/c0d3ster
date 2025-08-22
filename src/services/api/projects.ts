import type { ProjectItem } from '@/types'

import type { AssignedProject } from '../../hooks/useAssignedProjects'
import type { AvailableProject } from '../../hooks/useAvailableProjects'

export const fetchAvailableProjects = async (): Promise<AvailableProject[]> => {
  const response = await fetch('/api/developer/available-projects')

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in')
    }
    if (response.status === 403) {
      throw new Error('Access denied - developer privileges required')
    }
    throw new Error('Failed to fetch available projects')
  }

  const data = await response.json()
  return data.projects || []
}

export const fetchAssignedProjects = async (): Promise<AssignedProject[]> => {
  const response = await fetch('/api/developer/assigned-projects')

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in')
    }
    if (response.status === 403) {
      throw new Error('Access denied - developer privileges required')
    }
    throw new Error('Failed to fetch assigned projects')
  }

  const data = await response.json()
  return data.projects || []
}

export const fetchMyProjects = async (): Promise<ProjectItem[]> => {
  const response = await fetch('/api/my-projects')

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in')
    }
    throw new Error('Failed to fetch projects')
  }

  const data = await response.json()
  return data.items || []
}

export const assignToProject = async (projectId: string) => {
  const response = await fetch(
    `/api/developer/available-projects/${projectId}/assign`,
    {
      method: 'PATCH',
    }
  )

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json()
      throw new Error(
        errorData.error || 'Project already assigned or not available'
      )
    }
    if (response.status === 403) {
      throw new Error('Access denied - developer privileges required')
    }
    throw new Error('Failed to assign to project')
  }

  return response.json()
}
