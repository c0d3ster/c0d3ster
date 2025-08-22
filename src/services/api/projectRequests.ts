export type CreateProjectRequestData = {
  title: string
  description: string
  projectType: string
  budget?: string
  timeline?: string
  requirements?: any
  contactPreference?: string
  additionalInfo?: string
}

export const createProjectRequest = async (data: CreateProjectRequestData) => {
  const response = await fetch('/api/project-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in')
    }
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create project request')
  }

  return response.json()
}

export const fetchUserProjectRequests = async () => {
  const response = await fetch('/api/project-requests')

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in')
    }
    throw new Error('Failed to fetch project requests')
  }

  const data = await response.json()
  return data.requests || []
}
