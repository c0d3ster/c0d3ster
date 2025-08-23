'use client'

import { useState } from 'react'

// TODO: Fix type import when GraphQL types are properly generated
import { useApproveProjectRequest, useGetProjectRequests } from '@/apiClients'
import { ProjectRequestCard } from '@/components/molecules'
import { Toast } from '@/libs/Toast'

export const AdminDashboardSection = () => {
  // Use GraphQL hooks directly from the API client
  const {
    data: projectRequestsData,
    loading: adminLoading,
    error: adminError,
    refetch: adminRefetch,
  } = useGetProjectRequests()
  const [approveMutation] = useApproveProjectRequest()

  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Get the project requests directly from GraphQL
  const adminRequests = projectRequestsData?.projectRequests || []

  // Admin request handlers
  const handleUpdateStatus = async (_requestId: string, _status: string) => {
    try {
      // TODO: Implement updateProjectRequest mutation in GraphQL
      Toast.error('Update status not yet implemented in GraphQL')
    } catch (error) {
      Toast.error('Failed to update request status')
      throw error
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
        {['all', 'requested', 'in_review', 'approved', 'cancelled'].map(
          (status) => (
            <button
              key={status}
              type='button'
              onClick={() => setStatusFilter(status)}
              className={`rounded border px-3 py-1 font-mono text-xs font-bold transition-all duration-300 ${
                statusFilter === status
                  ? 'border-green-400 bg-green-400 text-black'
                  : 'border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400 hover:text-black'
              }`}
            >
              {status.toUpperCase().replace('_', ' ')} (
              {statusCounts[status as keyof typeof statusCounts] || 0})
            </button>
          )
        )}
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
              : `No ${statusFilter.replace('_', ' ')} requests`}
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
