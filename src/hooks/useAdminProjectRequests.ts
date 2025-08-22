import { useEffect, useState } from 'react'

export type ProjectRequestWithUser = {
  id: string
  userId: string
  title: string
  description: string
  projectType: string
  budget: string | null
  timeline: string | null
  requirements: any
  contactPreference: string | null
  additionalInfo: string | null
  status: string
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
  userEmail: string
  userFirstName: string | null
  userLastName: string | null
}

type UseAdminProjectRequestsReturn = {
  requests: ProjectRequestWithUser[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateRequestStatus: (
    requestId: string,
    status: string,
    reviewNotes?: string
  ) => Promise<void>
  approveRequest: (
    requestId: string,
    approvalData: {
      startDate?: string
      estimatedCompletionDate?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      techStack?: string[]
      budget?: number
      internalNotes?: string
    }
  ) => Promise<void>
}

export const useAdminProjectRequests = (): UseAdminProjectRequestsReturn => {
  const [requests, setRequests] = useState<ProjectRequestWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)

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
      setRequests(data.requests || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching admin project requests:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateRequestStatus = async (
    requestId: string,
    status: string,
    reviewNotes?: string
  ) => {
    try {
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

      // Refetch to get updated data
      await fetchRequests()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  const approveRequest = async (
    requestId: string,
    approvalData: {
      startDate?: string
      estimatedCompletionDate?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      techStack?: string[]
      budget?: number
      internalNotes?: string
    }
  ) => {
    try {
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
        throw new Error('Failed to approve project request')
      }

      // Refetch to get updated data
      await fetchRequests()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  return {
    requests,
    isLoading,
    error,
    refetch: fetchRequests,
    updateRequestStatus,
    approveRequest,
  }
}
