'use client'

import { ProjectStatusCard } from '@/components/molecules'
import { useMyProjects } from '@/hooks'

export const UserProjectsAndRequests = () => {
  const { items, isLoading, error } = useMyProjects()

  return (
    <>
      {/* Your Projects Section */}
      <div className='mb-8'>
        <h3 className='mb-4 font-mono text-lg font-bold text-green-400'>
          🚀 YOUR PROJECTS
        </h3>

        {/* Loading State */}
        {isLoading && (
          <div className='flex items-center justify-center'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
            <span className='ml-3 font-mono text-green-400'>
              Loading your projects...
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
        {!isLoading &&
          !error &&
          items.filter((item) => item.type === 'project').length === 0 && (
            <div className='flex flex-col items-center justify-center text-center'>
              <div className='mb-2 text-2xl'>🚀</div>
              <p className='font-mono text-sm text-green-300/60'>
                No projects yet
              </p>
            </div>
          )}

        {/* Projects Grid */}
        {!isLoading &&
          !error &&
          items.filter((item) => item.type === 'project').length > 0 && (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {items
                .filter((item) => item.type === 'project')
                .map((item) => (
                  <ProjectStatusCard
                    key={`${item.type}-${item.id}`}
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

        {/* Loading State */}
        {isLoading && (
          <div className='flex items-center justify-center'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent'></div>
            <span className='ml-3 font-mono text-yellow-400'>
              Loading your requests...
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
        {!isLoading &&
          !error &&
          items.filter((item) => item.type === 'request').length === 0 && (
            <div className='flex flex-col items-center justify-center text-center'>
              <div className='mb-2 text-2xl'>📋</div>
              <p className='font-mono text-sm text-yellow-300/60'>
                No pending requests
              </p>
            </div>
          )}

        {/* Requests Grid */}
        {!isLoading &&
          !error &&
          items.filter((item) => item.type === 'request').length > 0 && (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {items
                .filter((item) => item.type === 'request')
                .map((item) => (
                  <ProjectStatusCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                  />
                ))}
            </div>
          )}
      </div>
    </>
  )
}
