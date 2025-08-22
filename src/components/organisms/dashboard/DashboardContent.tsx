'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CompactUserProfile } from '@/components/atoms'
import { ProjectRequestCard, ProjectStatusCard } from '@/components/molecules'
import {
  useAdminProjectRequests,
  useCurrentUser,
  useMyProjects,
  useToast,
} from '@/hooks'

export const DashboardContent = () => {
  const { items, summary, isLoading, error } = useMyProjects()
  const { isAdmin } = useCurrentUser()

  // Admin functionality
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
  const handleUpdateStatus = async (
    requestId: string,
    status: string,
    reviewNotes?: string
  ) => {
    try {
      await updateRequestStatus(requestId, status, reviewNotes)
      showToast(`Request status updated to ${status}`, 'success')
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
      requested: 0,
      in_review: 0,
      approved: 0,
      cancelled: 0,
    }

    adminRequests.forEach((request) => {
      counts[request.status as keyof typeof counts]++
    })

    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className='pb-8'>
      {/* User Overview Section */}
      <div className='mb-8 rounded-lg border border-green-400/20 bg-black/80 p-6 shadow-2xl backdrop-blur-sm'>
        <div className='flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0'>
          {/* Left: Compact User Profile */}
          <div className='flex-1'>
            <CompactUserProfile />
          </div>

          {/* Right: Quick Stats */}
          <div className='lg:ml-8 lg:flex-shrink-0'>
            <div className='text-center lg:text-right'>
              <div className='mb-2 flex items-center justify-center space-x-3 lg:justify-end'>
                <span className='font-mono text-sm text-green-300'>
                  Status:
                </span>
                <span className='inline-flex rounded-full bg-green-400/20 px-3 py-1 font-mono text-xs font-bold text-green-400'>
                  ONLINE
                </span>
              </div>
              {isAdmin ? (
                <>
                  <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                    <span className='font-mono text-sm text-green-300'>
                      Total Requests:
                    </span>
                    <span className='font-mono text-sm font-bold text-green-400'>
                      {statusCounts.all}
                    </span>
                  </div>
                  <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                    <span className='font-mono text-sm text-green-300'>
                      Pending Review:
                    </span>
                    <span className='font-mono text-sm font-bold text-yellow-400'>
                      {statusCounts.requested}
                    </span>
                  </div>
                  <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                    <span className='font-mono text-sm text-green-300'>
                      In Review:
                    </span>
                    <span className='font-mono text-sm font-bold text-blue-400'>
                      {statusCounts.in_review}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                    <span className='font-mono text-sm text-green-300'>
                      Projects:
                    </span>
                    <span className='font-mono text-sm font-bold text-green-400'>
                      {summary.activeProjects} Active
                    </span>
                  </div>
                  <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                    <span className='font-mono text-sm text-green-300'>
                      Requests:
                    </span>
                    <span className='font-mono text-sm font-bold text-yellow-400'>
                      {summary.pendingRequests} Pending
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mb-8 rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm'>
        <h3 className='mb-4 font-mono text-lg font-bold text-green-400'>
          {isAdmin ? 'ADMIN ACTIONS' : 'QUICK ACTIONS'}
        </h3>
        {isAdmin ? (
          <div className='grid gap-3 md:grid-cols-3'>
            <button
              type='button'
              onClick={() => adminRefetch()}
              className='block rounded border border-green-400/30 bg-green-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
            >
              🔄 REFRESH REQUESTS
            </button>
            <button
              type='button'
              onClick={() => setStatusFilter('requested')}
              className='block rounded border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-yellow-400 transition-all duration-300 hover:bg-yellow-400 hover:text-black'
            >
              ⏳ PENDING ONLY
            </button>
            <button
              type='button'
              onClick={() => setStatusFilter('in_review')}
              className='block rounded border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-blue-400 transition-all duration-300 hover:bg-blue-400 hover:text-black'
            >
              👁️ IN REVIEW ONLY
            </button>
          </div>
        ) : (
          <div className='grid gap-3 md:grid-cols-2'>
            <Link
              href='/dashboard/request-project'
              className='block rounded border border-green-400/30 bg-green-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
            >
              📝 REQUEST NEW PROJECT
            </Link>
            <Link
              href='/dashboard/user-profile'
              className='block rounded border border-green-400/30 bg-green-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
            >
              ⚙️ MANAGE ACCOUNT
            </Link>
          </div>
        )}
      </div>

      {/* Admin Filter Bar */}
      {isAdmin && (
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
      )}

      {/* Projects Section */}
      <div className='rounded-lg border border-green-400/20 bg-black/40 p-6 backdrop-blur-sm'>
        <h3 className='mb-6 font-mono text-lg font-bold text-green-400'>
          {isAdmin ? 'PROJECT REQUESTS MANAGEMENT' : 'YOUR PROJECTS & REQUESTS'}
        </h3>

        {/* Loading State */}
        {(isAdmin ? adminLoading : isLoading) && (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
            <span className='ml-3 font-mono text-green-400'>
              Loading {isAdmin ? 'requests' : 'projects'}...
            </span>
          </div>
        )}

        {/* Error State */}
        {(isAdmin ? adminError : error) && (
          <div className='rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-center'>
            <p className='font-mono text-red-400'>
              Error: {isAdmin ? adminError : error}
            </p>
            {isAdmin && (
              <button
                type='button'
                onClick={() => adminRefetch()}
                className='mt-2 rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 transition-all duration-300 hover:bg-red-400 hover:text-black'
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!(
          (isAdmin ? adminLoading : isLoading) || (isAdmin ? adminError : error)
        ) &&
          (isAdmin ? filteredRequests : items).length === 0 && (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='mb-4 text-4xl'>{isAdmin ? '📋' : '🚀'}</div>
              <p className='mb-2 font-mono text-sm text-green-300'>
                {isAdmin
                  ? statusFilter === 'all'
                    ? 'No project requests found'
                    : `No ${statusFilter.replace('_', ' ')} requests`
                  : 'No projects or requests yet'}
              </p>
              <p className='font-mono text-xs text-green-300/60'>
                {isAdmin
                  ? 'Requests will appear here when clients submit them'
                  : 'Start by requesting your first project above'}
              </p>
            </div>
          )}

        {/* Projects/Requests Grid */}
        {!(
          (isAdmin ? adminLoading : isLoading) || (isAdmin ? adminError : error)
        ) &&
          (isAdmin ? filteredRequests : items).length > 0 && (
            <div
              className={`grid ${isAdmin ? 'gap-6 lg:grid-cols-2' : 'gap-4 md:grid-cols-2 xl:grid-cols-3'}`}
            >
              {isAdmin
                ? filteredRequests.map((request) => (
                    <ProjectRequestCard
                      key={request.id}
                      request={request}
                      updateStatusAction={handleUpdateStatus}
                      approveAction={handleApproveRequest}
                    />
                  ))
                : items.map((item) => (
                    <ProjectStatusCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                    />
                  ))}
            </div>
          )}

        {/* Summary */}
        {!(
          (isAdmin ? adminLoading : isLoading) || (isAdmin ? adminError : error)
        ) &&
          (isAdmin ? adminRequests : items).length > 0 && (
            <div className='mt-6 flex justify-center space-x-6 text-sm'>
              {isAdmin ? (
                <>
                  <div className='text-center'>
                    <div className='font-mono font-bold text-yellow-400'>
                      {statusCounts.requested}
                    </div>
                    <div className='font-mono text-green-300/60'>Pending</div>
                  </div>
                  <div className='text-center'>
                    <div className='font-mono font-bold text-blue-400'>
                      {statusCounts.in_review}
                    </div>
                    <div className='font-mono text-green-300/60'>In Review</div>
                  </div>
                  <div className='text-center'>
                    <div className='font-mono font-bold text-green-400'>
                      {statusCounts.approved}
                    </div>
                    <div className='font-mono text-green-300/60'>Approved</div>
                  </div>
                  <div className='text-center'>
                    <div className='font-mono font-bold text-red-400'>
                      {statusCounts.cancelled}
                    </div>
                    <div className='font-mono text-green-300/60'>Rejected</div>
                  </div>
                </>
              ) : (
                <>
                  <div className='text-center'>
                    <div className='font-mono font-bold text-green-400'>
                      {summary.activeProjects}
                    </div>
                    <div className='font-mono text-green-300/60'>
                      Active Projects
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='font-mono font-bold text-yellow-400'>
                      {summary.pendingRequests}
                    </div>
                    <div className='font-mono text-green-300/60'>
                      Pending Requests
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='font-mono font-bold text-blue-400'>
                      {summary.totalRequests}
                    </div>
                    <div className='font-mono text-green-300/60'>
                      Total Requests
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
      </div>
    </div>
  )
}
