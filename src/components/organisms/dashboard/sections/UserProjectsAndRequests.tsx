'use client'

import type { GetMyDashboardQuery } from '@/graphql/generated/graphql'

import { ProjectStatusCard } from '@/components/molecules'

type UserProjectsAndRequestsProps = {
  projects?: NonNullable<GetMyDashboardQuery['myDashboard']>['projects']
  projectRequests?: NonNullable<
    GetMyDashboardQuery['myDashboard']
  >['projectRequests']
}

export const UserProjectsAndRequests = ({
  projects,
  projectRequests,
}: UserProjectsAndRequestsProps) => {
  const projectsList = projects || []
  const projectRequestsList = projectRequests || []

  // Filter out project requests that have been approved (i.e., exist as projects)
  // This prevents showing the same request in both sections
  const approvedProjectRequestIds = projectsList
    .map((project) => project.requestId)
    .filter(Boolean) // Remove undefined/null values

  const filteredProjectRequests = projectRequestsList.filter(
    (request) => !approvedProjectRequestIds.includes(request.id)
  )

  // Temporary debugging
  console.warn(
    '🔍 DEBUG - Projects:',
    projectsList.map((p) => ({
      id: p.id,
      title: p.title,
      requestId: p.requestId,
    }))
  )
  console.warn(
    '🔍 DEBUG - ProjectRequests:',
    projectRequestsList.map((r) => ({ id: r.id, title: r.title }))
  )
  console.warn('🔍 DEBUG - Approved IDs:', approvedProjectRequestIds)
  console.warn(
    '🔍 DEBUG - Filtered Requests:',
    filteredProjectRequests.map((r) => ({ id: r.id, title: r.title }))
  )

  return (
    <>
      {/* Your Projects Section */}
      <div className='mb-8'>
        <h3 className='mb-4 font-mono text-lg font-bold text-green-400'>
          🚀 YOUR PROJECTS
        </h3>

        {/* Empty State */}
        {projectsList.length === 0 && (
          <div className='flex flex-col items-center justify-center text-center'>
            <div className='mb-2 text-2xl'>🚀</div>
            <p className='font-mono text-sm text-green-300/60'>
              No projects yet
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {projectsList.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {projectsList.map((item) => (
              <ProjectStatusCard
                key={`${item.__typename}-${item.id}`}
                item={item}
              />
            ))}
          </div>
        )}
      </div>

      {/* Your Requests Section */}
      <div>
        <h3 className='mb-4 font-mono text-lg font-bold text-yellow-400'>
          📋 YOUR REQUESTS
        </h3>

        {/* Empty State */}
        {filteredProjectRequests.length === 0 && (
          <div className='flex flex-col items-center justify-center text-center'>
            <div className='mb-2 text-2xl'>📋</div>
            <p className='font-mono text-sm text-yellow-300/60'>
              No pending requests
            </p>
          </div>
        )}

        {/* Requests Grid */}
        {filteredProjectRequests.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredProjectRequests.map((item) => (
              <ProjectStatusCard
                key={`${item.__typename}-${item.id}`}
                item={item}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
