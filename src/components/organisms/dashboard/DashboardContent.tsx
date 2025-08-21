'use client'

import Link from 'next/link'

import { CompactUserProfile } from '@/components/atoms'
import { ProjectStatusCard } from '@/components/molecules'
import { useMyProjects } from '@/hooks'

export const DashboardContent = () => {
  const { items, summary, isLoading, error } = useMyProjects()

  return (
    <>
      {/* User Overview Section */}
      <div className='mb-8 rounded-lg border border-green-400/20 bg-black/80 p-6 shadow-2xl backdrop-blur-sm'>
        <div className='flex items-center justify-between'>
          {/* Left: Compact User Profile */}
          <div className='flex-1'>
            <CompactUserProfile />
          </div>

          {/* Right: Quick Stats */}
          <div className='ml-8 flex-shrink-0'>
            <div className='text-right'>
              <div className='mb-2 flex items-center justify-end space-x-3'>
                <span className='font-mono text-sm text-green-300'>
                  Status:
                </span>
                <span className='inline-flex rounded-full bg-green-400/20 px-3 py-1 font-mono text-xs font-bold text-green-400'>
                  ONLINE
                </span>
              </div>
              <div className='flex items-center justify-end space-x-3'>
                <span className='font-mono text-sm text-green-300'>
                  Projects:
                </span>
                <span className='font-mono text-sm font-bold text-green-400'>
                  {summary.activeProjects} Active
                </span>
              </div>
              <div className='flex items-center justify-end space-x-3'>
                <span className='font-mono text-sm text-green-300'>
                  Requests:
                </span>
                <span className='font-mono text-sm font-bold text-yellow-400'>
                  {summary.pendingRequests} Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mb-8 rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm'>
        <h3 className='mb-4 font-mono text-lg font-bold text-green-400'>
          QUICK ACTIONS
        </h3>
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
      </div>

      {/* Projects Section */}
      <div className='rounded-lg border border-green-400/20 bg-black/40 p-6 backdrop-blur-sm'>
        <h3 className='mb-6 font-mono text-lg font-bold text-green-400'>
          YOUR PROJECTS & REQUESTS
        </h3>

        {/* Loading State */}
        {isLoading && (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
            <span className='ml-3 font-mono text-green-400'>
              Loading projects...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-center'>
            <p className='font-mono text-red-400'>Error: {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='mb-4 text-4xl'>🚀</div>
            <p className='mb-2 font-mono text-sm text-green-300'>
              No projects or requests yet
            </p>
            <p className='font-mono text-xs text-green-300/60'>
              Start by requesting your first project above
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && items.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {items.map((item) => (
              <ProjectStatusCard
                key={`${item.type}-${item.id}`}
                item={item as any}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        {!isLoading && !error && items.length > 0 && (
          <div className='mt-6 flex justify-center space-x-6 text-sm'>
            <div className='text-center'>
              <div className='font-mono font-bold text-green-400'>
                {summary.totalProjects}
              </div>
              <div className='font-mono text-green-300/60'>Active Projects</div>
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
              <div className='font-mono text-green-300/60'>Total Requests</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
