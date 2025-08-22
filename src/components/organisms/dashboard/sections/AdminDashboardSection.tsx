'use client'

import { useState } from 'react'

import { ProjectRequestCard } from '@/components/molecules'
import { useAdminProjectRequests, useToast } from '@/hooks'

export const AdminDashboardSection = () => {
  const {
    requests: adminRequests,
    isLoading: adminLoading,
    error: adminError,
    refetch: adminRefetch,
    updateRequestStatus,
    approveRequest,
  } = useAdminProjectRequests()

  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Admin request handlers
  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await updateRequestStatus(requestId, status)
      showToast('Request status updated successfully!', 'success')
    } catch (error) {
      showToast('Failed to update request status', 'error')
      throw error
    }
  }

  const handleApproveRequest = async (requestId: string, approvalData: any) => {
    try {
      await approveRequest(requestId, approvalData)
      showToast('Project request approved and project created!', 'success')
    } catch (error) {
      showToast('Failed to approve request', 'error')
      throw error
    }
  }

  // Admin request filtering
  const filteredRequests = adminRequests.filter((request) => {
    if (statusFilter === 'all') return true
    return request.status === statusFilter
  })

  const getStatusCounts = () => {
    const counts = {
      all: adminRequests.length,
      requested: adminRequests.filter((r) => r.status === 'requested').length,
      in_review: adminRequests.filter((r) => r.status === 'in_review').length,
      approved: adminRequests.filter((r) => r.status === 'approved').length,
      cancelled: adminRequests.filter((r) => r.status === 'cancelled').length,
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
          <p className='font-mono text-red-400'>Error: {adminError}</p>
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
          {filteredRequests.map((request) => (
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
