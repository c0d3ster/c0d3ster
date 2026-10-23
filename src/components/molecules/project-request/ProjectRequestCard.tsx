'use client'

import Link from 'next/link'

import type {
  ApproveProjectRequestInput,
  ProjectRequest,
  ProjectStatus,
} from '@/graphql/generated/graphql'

import { FeatureList } from '@/components/molecules'
import { formatCardDate } from '@/utils'
import { formatStatus, getStatusCardStyling } from '@/utils/Project'

import { ProjectRequestActions } from './ProjectRequestActions'

type ProjectRequestCardProps = {
  request: ProjectRequest
  updateStatusAction: (
    requestId: string,
    status: ProjectStatus,
    reviewNotes?: string
  ) => Promise<void>
  approveAction: (
    requestId: string,
    approvalData: ApproveProjectRequestInput
  ) => Promise<void>
}

export const ProjectRequestCard = ({
  request,
  updateStatusAction,
  approveAction,
}: ProjectRequestCardProps) => {

  // Use shared date utility for consistent formatting
  const formatDate = (dateString: string | undefined) => {
    return formatCardDate(dateString)
  }

  const userName =
    `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim() ||
    'Unknown User'

  return (
    <div className='relative rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm transition-colors duration-200 hover:border-green-400/40'>
      <Link
        href={`/dashboard/project-requests/${request.id}`}
        className='absolute inset-0 rounded-lg'
        aria-label={`View details for ${request.title}`}
      />
      {/* Header */}
      <div className='mb-4'>
        <div className='mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
          <h3 className='font-mono text-lg font-bold text-green-400'>
            {request.title}
          </h3>
          <span
            className={`self-start rounded border px-3 py-1 font-mono text-xs font-bold uppercase sm:shrink-0 ${getStatusCardStyling(request.status || 'unknown')}`}
          >
            {formatStatus(request.status || 'unknown')}
          </span>
        </div>
        <div className='space-y-1 text-sm'>
          <p className='wrap-break-word text-green-300'>
            <span className='text-green-300/60'>Client:</span> {userName} (
            {request.user?.email})
          </p>
          <p className='text-green-300'>
            <span className='text-green-300/60'>Type:</span>{' '}
            {request.projectType}
          </p>
          {request.budget && (
            <p className='text-green-300'>
              <span className='text-green-300/60'>Budget:</span> $
              {request.budget}
            </p>
          )}
          <p className='text-green-300'>
            <span className='text-green-300/60'>Submitted:</span>{' '}
            {formatDate(request.createdAt)}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className='mb-4'>
        <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
          Description:
        </h4>
        <p className='text-sm text-green-300/80'>{request.description}</p>
      </div>

      {/* Features */}
      <div className='mb-4'>
        <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
          Features:
        </h4>
        <FeatureList features={request.features} />
      </div>

      {/* Timeline */}
      {request.timeline && (
        <div className='mb-4'>
          <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
            Timeline:
          </h4>
          <p className='text-sm text-green-300/80'>{request.timeline}</p>
        </div>
      )}

      {/* Additional Info */}
      {request.additionalInfo && (
        <div className='mb-4'>
          <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
            Additional Info:
          </h4>
          <p className='text-sm text-green-300/80'>{request.additionalInfo}</p>
        </div>
      )}

      <ProjectRequestActions
        requestId={request.id}
        status={request.status}
        budget={request.budget}
        updateStatusAction={updateStatusAction}
        approveAction={approveAction}
      />
    </div>
  )
}
