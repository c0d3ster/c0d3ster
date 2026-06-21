'use client'

import { useState } from 'react'

import {
  useApproveProjectRequest,
  useGetProjectRequests,
  useUpdateProjectRequestStatus,
} from '@/apiClients'
import { ProjectRequestCard } from '@/components/molecules'
import { ProjectStatus } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'

type AdminDashboardSectionProps = {
  onDataRefreshAction?: () => void
}

export const AdminDashboardSection = ({ onDataRefreshAction }: AdminDashboardSectionProps) => {
  const {
    data: projectRequestsData,
    loading: adminLoading,
    error: adminError,
    refetch: adminRefetch,
  } = useGetProjectRequests()
  const [approveMutation] = useApproveProjectRequest()
  const [updateStatusMutation] = useUpdateProjectRequestStatus()

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')

  // Get the project requests directly from GraphQL
  const adminRequests = projectRequestsData?.projectRequests || []

  // Admin request handlers
  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await updateStatusMutation({ variables: { id: requestId, status } })
      Toast.success(`Project request status updated to ${status}`)
      await adminRefetch()
      onDataRefreshAction?.()
    } catch (error) {
      Toast.error('Failed to update request status')
      console.error('Update request status error:', error)
    }
  }

  const handleApproveRequest = async (
    requestId: string,
    _approvalData: any
  ) => {
    try {
      await approveMutation({ variables: { id: requestId } })
      Toast.success('Project request approved and project created!')
      await adminRefetch()
      onDataRefreshAction?.()
    } catch (error) {
      Toast.error('Failed to approve request')
      console.error('Approve request error:', error)
    }
  }

  // Admin request filtering
  const filteredRequests = adminRequests.filter((request: any) => {
    if (statusFilter === 'all') return true
    return request.status === statusFilter
  })

  const getStatusCounts = () => {
    const counts = {
      all: adminRequests.length,
      requested: adminRequests.filter((r: any) => r.status === 'requested')
        .length,
      in_review: adminRequests.filter((r: any) => r.status === 'in_review')
        .length,
      approved: adminRequests.filter((r: any) => r.status === 'approved')
        .length,
      cancelled: adminRequests.filter((r: any) => r.status === 'cancelled')
        .length,
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <>
      {/* Filter Bar */}
      <div className='mb-6 flex flex-wrap gap-2'>
        {(
          [
            ['all', 'ALL'],
            [ProjectStatus.Requested, 'REQUESTED'],
            [ProjectStatus.InReview, 'IN REVIEW'],
            [ProjectStatus.Approved, 'APPROVED'],
            [ProjectStatus.Cancelled, 'CANCELLED'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type='button'
            onClick={() => setStatusFilter(value)}
            className={`rounded border px-3 py-1 font-mono text-xs font-bold transition-all duration-300 ${
              statusFilter === value
                ? 'border-green-400 bg-green-400 text-black'
                : 'border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400 hover:text-black'
            }`}
          >
            {label} ({statusCounts[value as keyof typeof statusCounts] || 0})
          </button>
        ))}
      </div>

      {/* Admin Section - Project Requests */}
      {/* Loading State */}
      {adminLoading && (
        <div className='flex items-center justify-center py-12'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
          <span className='ml-3 font-mono text-green-400'>
            Loading requests...
          </span>
        </div>
      )}

      {/* Error State */}
      {adminError && (
        <div className='rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-center'>
          <p className='font-mono text-red-400'>Error: {adminError.message}</p>
          <button
            type='button'
            onClick={() => adminRefetch()}
            className='mt-2 rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 transition-all duration-300 hover:bg-red-400 hover:text-black'
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!adminLoading && !adminError && filteredRequests.length === 0 && (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='mb-4 text-4xl'>📋</div>
          <p className='mb-2 font-mono text-sm text-green-300'>
            {statusFilter === 'all'
              ? 'No project requests found'
              : `No ${statusFilter.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} requests`}
          </p>
          <p className='font-mono text-xs text-green-300/60'>
            Requests will appear here when clients submit them
          </p>
        </div>
      )}

      {/* Requests Grid */}
      {!adminLoading && !adminError && filteredRequests.length > 0 && (
        <div className='grid gap-6 lg:grid-cols-2'>
          {filteredRequests.map((request: any) => (
            <ProjectRequestCard
              key={request.id}
              request={request}
              updateStatusAction={handleUpdateStatus}
              approveAction={handleApproveRequest}
            />
          ))}
        </div>
      )}
    </>
  )
}
