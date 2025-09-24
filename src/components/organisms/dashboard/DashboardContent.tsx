'use client'

import Link from 'next/link'

import { useGetMe, useGetMyDashboard } from '@/apiClients'
import { CompactUserProfile } from '@/components/molecules'
import { ProjectStatus, UserRole } from '@/graphql/generated/graphql'
import { isAdminRole } from '@/utils/RoleConstants'

import {
  AdminDashboardSection,
  DeveloperDashboardSection,
  UserProjectsAndRequests,
} from './sections'

export const DashboardContent = () => {
  const { data: userData, loading: userLoading } = useGetMe()
  const {
    data: dashboardData,
    loading: dashboardLoading,
    refetch: refetchDashboard,
  } = useGetMyDashboard()

  const userRole = userData?.me?.role

  const isAdmin = userRole ? isAdminRole(userRole) : false
  const isDeveloper = userRole === UserRole.Developer
  const summary = dashboardData?.myDashboard?.summary
  const availableProjects = dashboardData?.myDashboard?.availableProjects || []
  const assignedProjects = dashboardData?.myDashboard?.assignedProjects || []

  // Determine if we're still loading the main content data
  const isContentLoading = userLoading || dashboardLoading

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      {/* User Profile */}
      <div className='mb-8 rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm'>
        <div className='flex flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0'>
          <CompactUserProfile />
          <div className='grid gap-4 text-center lg:text-right'>
            {isContentLoading ? (
              <div className='flex items-center justify-center'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
                <span className='ml-2 font-mono text-sm text-green-400'>
                  Loading...
                </span>
              </div>
            ) : isAdmin || isDeveloper ? (
              <>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Available:
                  </span>
                  <span className='font-mono text-sm font-bold text-blue-400'>
                    {(availableProjects as any[])?.length || 0}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Assigned:
                  </span>
                  <span className='font-mono text-sm font-bold text-green-400'>
                    {(assignedProjects as any[])?.length || 0}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Your Projects:
                  </span>
                  <span className='font-mono text-sm font-bold text-yellow-400'>
                    {(summary?.totalProjects || 0) +
                      (summary?.pendingReviewRequests || 0)}
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
                    {summary?.totalProjects || 0}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Total Requests:
                  </span>
                  <span className='font-mono text-sm font-bold text-yellow-400'>
                    {summary?.totalRequests || 0}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Pending Review:
                  </span>
                  <span className='font-mono text-sm font-bold text-orange-400'>
                    {summary?.pendingReviewRequests || 0}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    In Review:
                  </span>
                  <span className='font-mono text-sm font-bold text-blue-400'>
                    {summary?.inReviewRequests || 0}
                  </span>
                </div>
                <div className='flex items-center justify-center space-x-3 lg:justify-end'>
                  <span className='font-mono text-sm text-green-300'>
                    Active:
                  </span>
                  <span className='font-mono text-sm font-bold text-blue-400'>
                    {summary?.activeProjects || 0}
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

      {/* Admin Project Requests Management Section */}
      {isAdmin && (
        <div className='mb-8 rounded-lg border border-purple-400/20 bg-black/40 p-6 backdrop-blur-sm'>
          <div className='mb-6 flex items-center justify-between'>
            <h3 className='font-mono text-lg font-bold text-purple-400'>
              🔧 PROJECT REQUESTS MANAGEMENT
            </h3>
            {/* Summary Stats - Inline with title */}
            <div className='flex gap-6 rounded-lg border border-purple-400/20 bg-purple-400/5 p-3'>
              <div className='text-center'>
                <div className='font-mono text-xl font-bold text-purple-400'>
                  {summary?.pendingReviewRequests || 0}
                </div>
                <div className='font-mono text-xs text-green-300'>
                  Pending Review
                </div>
              </div>
              <div className='text-center'>
                <div className='font-mono text-xl font-bold text-orange-400'>
                  {summary?.inReviewRequests || 0}
                </div>
                <div className='font-mono text-xs text-green-300'>
                  In Review
                </div>
              </div>
              <div className='text-center'>
                <div className='font-mono text-xl font-bold text-blue-400'>
                  {
                    (dashboardData?.myDashboard?.projectRequests || []).filter(
                      (r) => r.status === ProjectStatus.Approved
                    ).length
                  }
                </div>
                <div className='font-mono text-xs text-green-300'>Approved</div>
              </div>
            </div>
          </div>
          <AdminDashboardSection />
        </div>
      )}

      {/* Main Projects & Requests Section */}
      <div className='rounded-lg border border-green-400/20 bg-black/40 p-6 backdrop-blur-sm'>
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
            {/* Developer-specific sections (Available & Assigned Projects) */}
            {(isDeveloper || isAdmin) && (
              <DeveloperDashboardSection
                availableProjects={availableProjects}
                assignedProjects={assignedProjects}
                onDataRefreshAction={() => {
                  // Refetch the dashboard data
                  refetchDashboard()
                }}
              />
            )}

            {/* Common Projects & Requests sections for ALL users */}
            <UserProjectsAndRequests
              projects={dashboardData?.myDashboard?.projects || []}
              projectRequests={
                dashboardData?.myDashboard?.projectRequests || []
              }
            />
          </>
        )}
      </div>
    </div>
  )
}
