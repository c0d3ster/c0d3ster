import type { ProjectRequestWithUser } from '../../hooks/useAdminProjectRequests'

export const fetchAdminProjectRequests = async (): Promise<
  ProjectRequestWithUser[]
> => {
  const response = await fetch('/api/admin/project-requests')

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in')
    }
    if (response.status === 403) {
      throw new Error('Access denied - admin privileges required')
    }
    throw new Error('Failed to fetch project requests')
  }

  const data = await response.json()
  return data.requests || []
}

export const updateProjectRequestStatus = async ({
  requestId,
  status,
  reviewNotes,
}: {
  requestId: string
  status: string
  reviewNotes?: string
}) => {
  const response = await fetch('/api/admin/project-requests', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestId,
      status,
      reviewNotes,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update request status')
  }

  return response.json()
}

export const approveProjectRequest = async ({
  requestId,
  ...approvalData
}: {
  requestId: string
  startDate?: string
  estimatedCompletionDate?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  techStack?: string[]
  budget?: number
  internalNotes?: string
}) => {
  const response = await fetch(
    `/api/admin/project-requests/${requestId}/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(approvalData),
    }
  )

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Conflict occurred')
    }
    throw new Error('Failed to approve project request')
  }

  return response.json()
}
