'use client'

// import Link from 'next/link'

import type {
  Project,
  ProjectDisplay,
  ProjectRequest,
  ProjectRequestDisplay,
} from '@/graphql/generated/graphql'

type ProjectItem =
  | Project
  | ProjectRequest
  | ProjectDisplay
  | ProjectRequestDisplay

// Prefer allowing only http/https to avoid `javascript:` and similar schemes.
// const safeExternalUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : '#')

type ProjectStatusCardProps = {
  item: ProjectItem
}

const getStatusInfo = (status: string | undefined, _typename: string) => {
  const statusMap = {
    // Request statuses
    requested: {
      label: 'Pending Review',
      color: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
      icon: '⏳',
    },
    in_review: {
      label: 'Under Review',
      color: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
      icon: '👀',
    },
    approved: {
      label: 'Approved',
      color: 'bg-green-400/20 text-green-400 border-green-400/30',
      icon: '✅',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-400/20 text-red-400 border-red-400/30',
      icon: '❌',
    },

    // Project statuses
    in_progress: {
      label: 'In Progress',
      color: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
      icon: '🚧',
    },
    in_testing: {
      label: 'Testing',
      color: 'bg-purple-400/20 text-purple-400 border-purple-400/30',
      icon: '🧪',
    },
    ready_for_launch: {
      label: 'Ready to Launch',
      color: 'bg-orange-400/20 text-orange-400 border-orange-400/30',
      icon: '🚀',
    },
    live: {
      label: 'Live',
      color: 'bg-green-400/20 text-green-400 border-green-400/30',
      icon: '🌐',
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-400/20 text-green-400 border-green-400/30',
      icon: '✅',
    },
    on_hold: {
      label: 'On Hold',
      color: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
      icon: '⏸️',
    },
  }

  return (
    statusMap[status as keyof typeof statusMap] || {
      label: status || 'unknown',
      color: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
      icon: '❓',
    }
  )
}

export const ProjectStatusCard = ({ item }: ProjectStatusCardProps) => {
  const statusInfo = getStatusInfo(
    item.status || 'unknown',
    item.__typename || ''
  )
  const isProject =
    item.__typename === 'Project' || item.__typename === 'ProjectDisplay'

  // Check if this is a project with client information
  const hasClientInfo =
    (item.__typename === 'Project' || item.__typename === 'ProjectDisplay') &&
    'client' in item &&
    item.client
  const clientName = hasClientInfo
    ? `${item.client.firstName || ''} ${item.client.lastName || ''}`.trim() ||
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
          className={`flex items-center space-x-1 rounded-full border px-2 py-1 font-mono text-xs font-bold whitespace-nowrap ${statusInfo.color}`}
        >
          <span>{statusInfo.icon}</span>
          <span>{statusInfo.label}</span>
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
        {/* TODO: Add back when liveUrl, stagingUrl, repositoryUrl are added to GraphQL schema
        {isProject && 'liveUrl' in item && item.liveUrl && (
          <Link
            href={safeExternalUrl(item.liveUrl)}
            target='_blank'
            rel='noopener noreferrer'
            className='min-w-0 flex-1 rounded border border-green-400/30 bg-green-400/10 px-3 py-2 text-center font-mono text-xs text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
          >
            🌐 LIVE
          </Link>
        )}

        {isProject && 'stagingUrl' in item && item.stagingUrl && (
          <Link
            href={safeExternalUrl(item.stagingUrl)}
            target='_blank'
            rel='noopener noreferrer'
            className='min-w-0 flex-1 rounded border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-center font-mono text-xs text-blue-400 transition-all duration-300 hover:bg-blue-400 hover:text-black'
          >
            🧪 STAGING
          </Link>
        )}

        {item.__typename === 'Project' &&
          'repositoryUrl' in item &&
          item.repositoryUrl && (
            <Link
              href={safeExternalUrl(item.repositoryUrl)}
              target='_blank'
              rel='noopener noreferrer'
              className='min-w-0 flex-1 rounded border border-purple-400/30 bg-purple-400/10 px-3 py-2 text-center font-mono text-xs text-purple-400 transition-all duration-300 hover:bg-purple-400 hover:text-black'
            >
              📁 REPO
            </Link>
          )}
        */}

        <div className='min-w-0 flex-1 rounded border border-green-400/30 bg-green-400/5 px-3 py-2 text-center font-mono text-xs text-green-400/60'>
          {item.__typename === 'Project' || item.__typename === 'ProjectDisplay'
            ? 'VIEW DETAILS'
            : 'VIEW REQUEST'}
        </div>
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
