'use client'

import Link from 'next/link'

import type {
  Project,
  ProjectDisplay,
  ProjectRequest,
  ProjectRequestDisplay,
} from '@/graphql/generated/graphql'

import {
  formatStatus,
  generateSlug,
  getStatusCardStyling,
} from '@/utils/Project'

type ProjectItem =
  | Project
  | ProjectRequest
  | ProjectDisplay
  | ProjectRequestDisplay

type ProjectStatusCardProps = {
  item: ProjectItem
}

const getStatusIcon = (status: string | undefined) => {
  const iconMap = {
    // Request statuses
    requested: '⏳',
    in_review: '👀',
    approved: '✅',
    cancelled: '❌',
    // Project statuses
    in_progress: '🚧',
    in_testing: '🧪',
    ready_for_launch: '🚀',
    live: '🌐',
    completed: '✅',
    on_hold: '⏸️',
  }

  return iconMap[status as keyof typeof iconMap] || '❓'
}

export const ProjectStatusCard = ({ item }: ProjectStatusCardProps) => {
  const status = item.status || 'unknown'
  const statusIcon = getStatusIcon(status)
  const isProject =
    item.__typename === 'Project' || item.__typename === 'ProjectDisplay'

  // Check if this is a project with client information
  const hasClientInfo =
    (item.__typename === 'Project' || item.__typename === 'ProjectDisplay') &&
    'client' in item &&
    item.client
  const clientName = hasClientInfo
    ? typeof item.client === 'string'
      ? item.client
      : `${item.client.firstName || ''} ${item.client.lastName || ''}`.trim() ||
        item.client.email ||
        'Unknown Client'
    : null

  // Check if this is an assigned project (has a developer)
  const isAssignedProject = isProject && 'developer' in item && item.developer

  return (
    <div className='flex h-full min-h-[280px] flex-col rounded-lg border border-green-400/20 bg-black/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-400/40 hover:bg-black/80'>
      {/* Header */}
      <div className='mb-3 flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate font-mono text-lg font-bold text-green-400'>
            {item.title}
          </h3>
          <p className='font-mono text-xs tracking-wide text-green-300/60 uppercase'>
            {(item.projectType || 'unknown').replace('_', ' ')}
          </p>
          {/* Role indicator for assigned projects */}
          {isAssignedProject && (
            <div className='mt-1 flex flex-wrap gap-1'>
              <span className='inline-flex rounded-full bg-blue-400/20 px-3 py-1 font-mono text-xs font-bold text-blue-400'>
                ASSIGNED
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center space-x-1 rounded-full border px-2 py-1 font-mono text-xs font-bold whitespace-nowrap ${getStatusCardStyling(status)}`}
        >
          <span>{statusIcon}</span>
          <span>{formatStatus(status)}</span>
        </div>
      </div>

      {/* Client Info for projects */}
      {hasClientInfo && clientName && (
        <div className='mb-3 rounded border border-blue-400/20 bg-blue-400/5 p-2'>
          <p className='font-mono text-xs text-blue-400'>
            <span className='text-blue-400/60'>Client:</span> {clientName}
          </p>
          {item.__typename === 'Project' &&
            'client' in item &&
            item.client?.email && (
              <p className='font-mono text-xs text-blue-400/80'>
                {item.client.email}
              </p>
            )}
        </div>
      )}

      {/* Description */}
      <p className='mb-4 line-clamp-2 font-mono text-sm text-green-300/80'>
        {item.description}
      </p>

      {/* Project Details - grows to fill space */}
      <div className='mb-4 flex-1 space-y-2'>
        {/* Additional Info for Project Requests */}
        {(item.__typename === 'ProjectRequest' ||
          item.__typename === 'ProjectRequestDisplay') &&
          'additionalInfo' in item &&
          item.additionalInfo && (
            <div className='mb-2'>
              <p className='font-mono text-sm text-green-300/70 italic'>
                <span className='text-green-300/60'>Notes: </span>
                {item.additionalInfo}
              </p>
            </div>
          )}

        {item.budget && (
          <div className='flex justify-between text-sm'>
            <span className='font-mono text-green-300/60'>Budget:</span>
            <span className='font-mono text-green-400'>${item.budget}</span>
          </div>
        )}

        {(item.__typename === 'Project' ||
          item.__typename === 'ProjectDisplay') &&
          'progressPercentage' in item &&
          item.progressPercentage !== null && (
            <div className='space-y-1'>
              <div className='flex justify-between text-sm'>
                <span className='font-mono text-green-300/60'>Progress:</span>
                <span className='font-mono text-green-400'>
                  {item.progressPercentage}%
                </span>
              </div>
              <div className='h-2 w-full rounded-full bg-green-400/20'>
                <div
                  className='h-full rounded-full bg-green-400 transition-all duration-300'
                  style={{ width: `${item.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

        {(item.__typename === 'ProjectRequest' ||
          item.__typename === 'ProjectRequestDisplay') &&
          'timeline' in item &&
          item.timeline && (
            <div className='flex justify-between text-sm'>
              <span className='font-mono text-green-300/60'>Timeline:</span>
              <span className='font-mono text-green-400'>{item.timeline}</span>
            </div>
          )}

        {/* Tech Stack for projects */}
        {(item.__typename === 'Project' ||
          item.__typename === 'ProjectDisplay') &&
          'techStack' in item &&
          item.techStack &&
          Array.isArray(item.techStack) &&
          item.techStack.length > 0 && (
            <div className='space-y-1'>
              <span className='font-mono text-sm text-green-300/60'>
                Tech Stack:
              </span>
              <div className='flex flex-wrap gap-1'>
                {item.techStack.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className='rounded bg-green-400/20 px-2 py-1 font-mono text-xs text-green-400'
                  >
                    {tech}
                  </span>
                ))}
                {item.techStack.length > 3 && (
                  <span className='rounded bg-green-400/10 px-2 py-1 font-mono text-xs text-green-400/60'>
                    +{item.techStack.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Action Links */}
      <div className='mb-3 flex flex-wrap gap-2'>
        <Link
          href={`/projects/${generateSlug(item.projectName || item.title || 'untitled')}`}
          className='min-w-0 flex-1 cursor-pointer rounded border border-green-400/30 bg-green-400/5 px-3 py-2 text-center font-mono text-xs text-green-400/60 transition-all duration-300 hover:border-green-400/50 hover:bg-green-400/20 hover:text-green-400'
        >
          {item.__typename === 'Project' || item.__typename === 'ProjectDisplay'
            ? 'VIEW DETAILS'
            : 'VIEW REQUEST'}
        </Link>
      </div>

      {/* Footer - pinned to bottom */}
      <div className='border-t border-green-400/10 pt-3 font-mono text-xs text-green-300/50'>
        {item.__typename === 'Project' || item.__typename === 'ProjectDisplay'
          ? 'Project'
          : 'Request'}{' '}
        •{' '}
        {item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : 'Unknown Date'}
      </div>
    </div>
  )
}
