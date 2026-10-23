'use client'

import { useState } from 'react'

import type { ApproveProjectRequestInput } from '@/graphql/generated/graphql'

import { ProjectPriority, ProjectStatus } from '@/graphql/generated/graphql'

type ProjectRequestActionsProps = {
  requestId: string
  status?: string | null
  budget?: number | null
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

// Review / approve / reject controls shared by the admin request card and the request detail page
export const ProjectRequestActions = ({
  requestId,
  status,
  budget,
  updateStatusAction,
  approveAction,
}: ProjectRequestActionsProps): React.ReactElement => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [approvalData, setApprovalData] = useState<ApproveProjectRequestInput>({
    startDate: new Date().toISOString().split('T')[0],
    estimatedCompletionDate: '',
    priority: ProjectPriority.Medium,
    techStack: [],
    budget: budget ?? undefined,
    internalNotes: '',
  })

  const handleStatusUpdate = async (
    newStatus: ProjectStatus
  ): Promise<void> => {
    try {
      setIsUpdating(true)
      await updateStatusAction(requestId, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async (): Promise<void> => {
    try {
      setIsUpdating(true)
      await approveAction(requestId, approvalData)
      setShowApprovalForm(false)
    } catch (error) {
      console.error('Failed to approve request:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      {/* Action Buttons */}
      <div className='relative z-10 flex flex-wrap gap-2'>
        {status === ProjectStatus.Requested && (
          <button
            type='button'
            onClick={() => handleStatusUpdate(ProjectStatus.InReview)}
            disabled={isUpdating}
            className='rounded border border-blue-400/30 bg-blue-400/10 px-4 py-2 font-mono text-sm text-blue-400 transition-all duration-300 hover:bg-blue-400 hover:text-black disabled:opacity-50'
          >
            {isUpdating ? 'Updating...' : 'Start Review'}
          </button>
        )}

        {status === ProjectStatus.InReview && !showApprovalForm && (
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

        {status === ProjectStatus.Requested && (
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
        <div className='relative z-10 mt-6 rounded border border-green-400/30 bg-green-400/5 p-4'>
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
                value={approvalData.startDate ?? ''}
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
                value={approvalData.estimatedCompletionDate ?? ''}
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
                value={approvalData.priority ?? ProjectPriority.Medium}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    priority: Object.values(ProjectPriority).find(
                      (priority) => priority === e.target.value
                    ),
                  })
                }
                className='w-full rounded border border-green-400/30 bg-black/60 px-3 py-2 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
              >
                <option value={ProjectPriority.Low}>Low</option>
                <option value={ProjectPriority.Medium}>Medium</option>
                <option value={ProjectPriority.High}>High</option>
                <option value={ProjectPriority.Urgent}>Urgent</option>
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
              value={approvalData.internalNotes ?? ''}
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
    </>
  )
}
