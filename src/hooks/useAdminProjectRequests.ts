import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  approveProjectRequest,
  fetchAdminProjectRequests,
  updateProjectRequestStatus,
} from '@/services/api'

import { useCurrentUser } from './useCurrentUser'

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

type UseAdminProjectRequestsOptions = { enabled?: boolean }

export const useAdminProjectRequests = (
  opts: UseAdminProjectRequestsOptions = {}
): UseAdminProjectRequestsReturn => {
  const { enabled = true } = opts
  const { isAdmin, isLoading: userLoading } = useCurrentUser()
  const queryClient = useQueryClient()

  // Main query for fetching admin project requests
  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'project-requests'],
    queryFn: fetchAdminProjectRequests,
    enabled: enabled && !userLoading && isAdmin,
    staleTime: 30000, // Consider data fresh for 30 seconds
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

  // Mutation for updating request status
  const updateStatusMutation = useMutation({
    mutationFn: updateProjectRequestStatus,
    onSuccess: () => {
      // Invalidate and refetch admin project requests
      queryClient.invalidateQueries({ queryKey: ['admin', 'project-requests'] })
    },
  })

  // Mutation for approving requests
  const approveMutation = useMutation({
    mutationFn: approveProjectRequest,
    onSuccess: () => {
      // Invalidate multiple queries since approval creates a project
      queryClient.invalidateQueries({ queryKey: ['admin', 'project-requests'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['available-projects'] })
    },
  })

  return {
    requests,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch()
    },
    updateRequestStatus: async (
      requestId: string,
      status: string,
      reviewNotes?: string
    ) => {
      await updateStatusMutation.mutateAsync({ requestId, status, reviewNotes })
    },
    approveRequest: async (
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
      await approveMutation.mutateAsync({ requestId, ...approvalData })
    },
  }
}
