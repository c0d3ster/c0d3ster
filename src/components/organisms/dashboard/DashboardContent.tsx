'use client'

import Link from 'next/link'

import { CompactUserProfile } from '@/components/atoms'
import {
  useAdminProjectRequests,
  useAssignedProjects,
  useAvailableProjects,
  useCurrentUser,
  useMyProjects,
} from '@/hooks'

import {
  AdminDashboardSection,
  ClientDashboardSection,
  DeveloperDashboardSection,
} from './sections'

export const DashboardContent = () => {
  const { isAdmin, isDeveloper } = useCurrentUser()
  const { summary, isLoading: myProjectsLoading } = useMyProjects()
  const { projects: availableProjects, isLoading: availableLoading } =
    useAvailableProjects()
  const { projects: assignedProjects, isLoading: assignedLoading } =
    useAssignedProjects()
  const { requests: adminRequests, isLoading: adminLoading } =
    useAdminProjectRequests()

  const getStatusCounts = () => {
    const counts = {
      all: adminRequests.length,
      requested: adminRequests.filter((r) => r.status === 'requested').length,
      in_review: adminRequests.filter((r) => r.status === 'in_review').length,
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  // Determine if we're still loading the main content data
  const isContentLoading =
    myProjectsLoading ||
    (isAdmin && adminLoading) ||
    (isDeveloper && (availableLoading || assignedLoading))

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      {/* User Profile */}
      <div className='mb-8 rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm'>
        <div className='flex flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0'>
          <CompactUserProfile />
          <div className='grid gap-4 text-center lg:text-right'>
            <div className='flex flex-wrap items-center justify-center gap-3 lg:justify-end'>
              <span className='inline-flex rounded-full bg-green-400/10 px-3 py-1 font-mono text-xs font-bold text-green-400'>
                ACTIVE
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
            ) : isDeveloper ? (
              <>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Available:
                  </span>
                  <span className='font-mono text-sm font-bold text-blue-400'>
                    {availableProjects.length}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Assigned:
                  </span>
                  <span className='font-mono text-sm font-bold text-green-400'>
                    {assignedProjects.length}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Your Projects:
                  </span>
                  <span className='font-mono text-sm font-bold text-yellow-400'>
                    {summary.totalProjects + summary.totalRequests}
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
                    {summary.totalProjects}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Requests:
                  </span>
                  <span className='font-mono text-sm font-bold text-yellow-400'>
                    {summary.totalRequests}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Active:
                  </span>
                  <span className='font-mono text-sm font-bold text-blue-400'>
                    {summary.activeProjects}
                  </span>
                </div>
              </>
            )}
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
            ➕ REQUEST PROJECT
          </Link>
          <Link
            href='/dashboard/user-profile'
            className='block rounded border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-blue-400 transition-all duration-300 hover:bg-blue-400 hover:text-black'
          >
            👤 PROFILE SETTINGS
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className='rounded-lg border border-green-400/20 bg-black/40 p-6 backdrop-blur-sm'>
        <h3 className='mb-6 font-mono text-lg font-bold text-green-400'>
          {isAdmin ? 'PROJECT REQUESTS MANAGEMENT' : 'YOUR PROJECTS & REQUESTS'}
        </h3>

        {/* Role-specific Content */}
        {isContentLoading ? (
          <div className='flex items-center justify-center'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
            <span className='ml-3 font-mono text-green-400'>
              Loading projects...
            </span>
          </div>
        ) : (
          <>
            {isAdmin && (
              <>
                <AdminDashboardSection />
                <div className='mb-8'></div> {/* Spacer */}
              </>
            )}
            {isDeveloper && <DeveloperDashboardSection />}
            {!isDeveloper && <ClientDashboardSection />}
          </>
        )}
      </div>
    </div>
  )
}
