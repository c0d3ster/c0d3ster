'use client'

import { ProjectStatusCard } from '@/components/molecules'
import { useMyProjects } from '@/hooks'

export const ClientDashboardSection = () => {
  const { items, summary, isLoading, error } = useMyProjects()

  return (
    <>
      {/* Loading State */}
      {isLoading && (
        <div className='flex items-center justify-center'>
          <div className='h-6 w-6 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
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
        <div className='flex flex-col items-center justify-center text-center'>
          <div className='mb-2 text-2xl'>🚀</div>
          <p className='font-mono text-sm text-green-300/60'>
            No projects or requests yet
          </p>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && items.length > 0 && (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {items.map((item) => (
            <ProjectStatusCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && items.length > 0 && (
        <div className='mt-6 flex justify-center space-x-6 text-sm'>
          <span className='font-mono text-green-300/70'>
            {summary.totalProjects} project
            {summary.totalProjects !== 1 ? 's' : ''}
          </span>
          <span className='font-mono text-green-300/70'>•</span>
          <span className='font-mono text-green-300/70'>
            {summary.totalRequests} request
            {summary.totalRequests !== 1 ? 's' : ''}
          </span>
          <span className='font-mono text-green-300/70'>•</span>
          <span className='font-mono text-green-300/70'>
            {summary.activeProjects} active
          </span>
        </div>
      )}
    </>
  )
}
