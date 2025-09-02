'use client'

import { useState } from 'react'

import type { ProjectRequest } from '@/graphql/generated/graphql'

import { ProjectStatus } from '@/graphql/generated/graphql'
import { formatStatus, getStatusCardStyling } from '@/utils/Project'

import { RequirementsList } from './RequirementsList'

type ProjectRequestCardProps = {
  request: ProjectRequest
  updateStatusAction: (
    requestId: string,
    status: ProjectStatus,
    reviewNotes?: string
  ) => Promise<void>
  approveAction: (
    requestId: string,
    approvalData: {
      startDate?: string
      estimatedCompletionDate?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      techStack?: string[]
      budget?: number
      internalNotes?: string
    }
  ) => Promise<void>
}

export const ProjectRequestCard = ({
  request,
  updateStatusAction,
  approveAction,
}: ProjectRequestCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [approvalData, setApprovalData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    estimatedCompletionDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    techStack: [] as string[],
    budget: request.budget ?? undefined,
    internalNotes: '',
  })

  const handleStatusUpdate = async (newStatus: ProjectStatus) => {
    try {
      setIsUpdating(true)
      await updateStatusAction(request.id, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    try {
      setIsUpdating(true)
      await approveAction(request.id, approvalData)
      setShowApprovalForm(false)
    } catch (error) {
      console.error('Failed to approve request:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown Date'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      console.error('Invalid date:', dateString, error)
      return 'Invalid Date'
    }
  }

  const userName =
    `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim() ||
    'Unknown User'

  return (
    <div className='rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm'>
      {/* Header */}
      <div className='mb-4 flex items-start justify-between'>
        <div>
          <h3 className='mb-2 font-mono text-lg font-bold text-green-400'>
            {request.title}
          </h3>
          <div className='space-y-1 text-sm'>
            <p className='text-green-300'>
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
        <span
          className={`rounded border px-3 py-1 font-mono text-xs font-bold uppercase ${getStatusCardStyling(request.status || 'unknown')}`}
        >
          {formatStatus(request.status || 'unknown')}
        </span>
      </div>

      {/* Description */}
      <div className='mb-4'>
        <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
          Description:
        </h4>
        <p className='text-sm text-green-300/80'>{request.description}</p>
      </div>

      {/* Requirements */}
      <div className='mb-4'>
        <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
          Requirements:
        </h4>
        <RequirementsList requirements={request.requirements} />
      </div>

      {/* Additional Info */}
      {request.additionalInfo && (
        <div className='mb-4'>
          <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
            Additional Info:
          </h4>
          <p className='text-sm text-green-300/80'>{request.additionalInfo}</p>
        </div>
      )}

      {/* Timeline */}
      {request.timeline && (
        <div className='mb-4'>
          <h4 className='mb-2 font-mono text-sm font-bold text-green-300'>
            Timeline:
          </h4>
          <p className='text-sm text-green-300/80'>{request.timeline}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex flex-wrap gap-2'>
        {request.status === ProjectStatus.Requested && (
          <button
            type='button'
            onClick={() => handleStatusUpdate(ProjectStatus.InReview)}
            disabled={isUpdating}
            className='rounded border border-blue-400/30 bg-blue-400/10 px-4 py-2 font-mono text-sm text-blue-400 transition-all duration-300 hover:bg-blue-400 hover:text-black disabled:opacity-50'
          >
            {isUpdating ? 'Updating...' : 'Start Review'}
          </button>
        )}

        {request.status === ProjectStatus.InReview && !showApprovalForm && (
          <>
            <button
              type='button'
              onClick={() => setShowApprovalForm(true)}
              disabled={isUpdating}
              className='rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black disabled:opacity-50'
            >
              Approve & Create Project
            </button>
            <button
              type='button'
              onClick={() => handleStatusUpdate(ProjectStatus.Cancelled)}
              disabled={isUpdating}
              className='rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 transition-all duration-300 hover:bg-red-400 hover:text-black disabled:opacity-50'
            >
              Reject
            </button>
          </>
        )}

        {request.status === ProjectStatus.Requested && (
          <button
            type='button'
            onClick={() => handleStatusUpdate(ProjectStatus.Cancelled)}
            disabled={isUpdating}
            className='rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 transition-all duration-300 hover:bg-red-400 hover:text-black disabled:opacity-50'
          >
            Reject
          </button>
        )}
      </div>

      {/* Approval Form Modal */}
      {showApprovalForm && (
        <div className='mt-6 rounded border border-green-400/30 bg-green-400/5 p-4'>
          <h4 className='mb-4 font-mono text-sm font-bold text-green-400'>
            Project Approval Details
          </h4>

          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <label
                htmlFor='start-date'
                className='mb-1 block font-mono text-xs text-green-300'
              >
                Start Date
              </label>
              <input
                id='start-date'
                type='date'
                value={approvalData.startDate}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    startDate: e.target.value,
                  })
                }
                className='w-full rounded border border-green-400/30 bg-black/60 px-3 py-2 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
              />
            </div>

            <div>
              <label
                htmlFor='completion-date'
                className='mb-1 block font-mono text-xs text-green-300'
              >
                Est. Completion Date
              </label>
              <input
                id='completion-date'
                type='date'
                value={approvalData.estimatedCompletionDate}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    estimatedCompletionDate: e.target.value,
                  })
                }
                className='w-full rounded border border-green-400/30 bg-black/60 px-3 py-2 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
              />
            </div>

            <div>
              <label
                htmlFor='priority'
                className='mb-1 block font-mono text-xs text-green-300'
              >
                Priority
              </label>
              <select
                id='priority'
                value={approvalData.priority}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    priority: e.target.value as
                      | 'low'
                      | 'medium'
                      | 'high'
                      | 'urgent',
                  })
                }
                className='w-full rounded border border-green-400/30 bg-black/60 px-3 py-2 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
              >
                <option value='low'>Low</option>
                <option value='medium'>Medium</option>
                <option value='high'>High</option>
                <option value='urgent'>Urgent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor='budget'
                className='mb-1 block font-mono text-xs text-green-300'
              >
                Budget Override
              </label>
              <input
                id='budget'
                type='number'
                step='0.01'
                value={approvalData.budget ?? ''}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    budget: e.target.value
                      ? Number.parseFloat(e.target.value)
                      : undefined,
                  })
                }
                className='w-full rounded border border-green-400/30 bg-black/60 px-3 py-2 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
                placeholder='Optional budget override'
              />
            </div>
          </div>

          <div className='mt-4'>
            <label
              htmlFor='internal-notes'
              className='mb-1 block font-mono text-xs text-green-300'
            >
              Internal Notes
            </label>
            <textarea
              id='internal-notes'
              value={approvalData.internalNotes}
              onChange={(e) =>
                setApprovalData({
                  ...approvalData,
                  internalNotes: e.target.value,
                })
              }
              className='w-full rounded border border-green-400/30 bg-black/60 px-3 py-2 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
              rows={3}
              placeholder='Internal notes for the project team...'
            />
          </div>

          <div className='mt-4 flex gap-2'>
            <button
              type='button'
              onClick={handleApprove}
              disabled={isUpdating}
              className='rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black disabled:opacity-50'
            >
              {isUpdating ? 'Creating Project...' : 'Approve & Create Project'}
            </button>
            <button
              type='button'
              onClick={() => setShowApprovalForm(false)}
              disabled={isUpdating}
              className='rounded border border-gray-400/30 bg-gray-400/10 px-4 py-2 font-mono text-sm text-gray-400 transition-all duration-300 hover:bg-gray-400 hover:text-black'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
