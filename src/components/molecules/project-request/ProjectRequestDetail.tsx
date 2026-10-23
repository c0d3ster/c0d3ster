'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { ApproveProjectRequestInput } from '@/graphql/generated/graphql'

import {
  useApproveProjectRequest,
  useGetProjectRequestById,
  useUpdateProjectRequestStatus,
} from '@/apiClients/projectRequestApiClient'
import { useGetMe } from '@/apiClients/userApiClient'
import { Toast } from '@/libs/Toast'
import { formatCardDate, generateSlug } from '@/utils'
import { formatStatus, getStatusCardStyling } from '@/utils/Project'
import { isAdminRole } from '@/utils/RoleConstants'

import { FeatureList } from './FeatureList'
import { ProjectRequestActions } from './ProjectRequestActions'

type ProjectRequestDetailProps = {
  id: string
}

export const ProjectRequestDetail = ({ id }: ProjectRequestDetailProps) => {
  const router = useRouter()
  const { data, loading, error, refetch } = useGetProjectRequestById(id)
  const { data: meData } = useGetMe()
  const [approveMutation] = useApproveProjectRequest()
  const [updateStatusMutation] = useUpdateProjectRequestStatus()

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: string
  ): Promise<void> => {
    try {
      await updateStatusMutation({
        variables: { id: requestId, status: newStatus },
      })
      Toast.success(`Project request status updated to ${newStatus}`)
      await refetch()
    } catch (updateError) {
      Toast.error('Failed to update request status')
      console.error('Update request status error:', updateError)
    }
  }

  const handleApprove = async (
    requestId: string,
    approvalData: ApproveProjectRequestInput
  ): Promise<void> => {
    try {
      const { data: approved } = await approveMutation({
        variables: { id: requestId, input: approvalData },
      })
      Toast.success('Project request approved and project created!')
      await refetch()
      const projectName = data?.projectRequest?.projectName
      if (approved?.approveProjectRequest && projectName) {
        router.push(`/projects/${generateSlug(projectName)}`)
      }
    } catch (approveError) {
      Toast.error('Failed to approve request')
      console.error('Approve request error:', approveError)
    }
  }

  if (loading) {
    return (
      <div className='py-20 text-center font-mono text-green-400/60'>
        Loading...
      </div>
    )
  }

  if (error || !data?.projectRequest) {
    return (
      <div className='py-20 text-center font-mono text-red-400/60'>
        Request not found.{' '}
        <Link
          href='/dashboard'
          className='text-green-400 underline hover:text-green-300'
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const request = data.projectRequest
  const status = request.status || 'unknown'

  return (
    <div className='mx-auto max-w-3xl'>
      {/* Header */}
      <div className='mb-8 flex items-start justify-between gap-4'>
        <div>
          <h1 className='font-mono text-2xl font-bold text-green-400'>
            {request.title || request.projectName}
          </h1>
          <p className='mt-1 font-mono text-sm tracking-wide text-green-300/60 uppercase'>
            {(request.projectType || 'unknown').replace('_', ' ')}
          </p>
        </div>
        <span
          className={`rounded border px-3 py-1 font-mono text-xs font-bold whitespace-nowrap uppercase ${getStatusCardStyling(status)}`}
        >
          {formatStatus(status)}
        </span>
      </div>

      {isAdminRole(meData?.me?.role) && (
        <div className='mb-6'>
          <ProjectRequestActions
            requestId={request.id}
            status={request.status}
            budget={request.budget}
            updateStatusAction={handleUpdateStatus}
            approveAction={handleApprove}
          />
        </div>
      )}

      <div className='space-y-6'>
        {/* Meta */}
        <div className='grid grid-cols-2 gap-4 rounded-lg border border-green-400/20 bg-black/60 p-4'>
          {request.budget && (
            <div>
              <p className='font-mono text-xs text-green-300/60 uppercase'>
                Budget
              </p>
              <p className='font-mono text-sm text-green-300'>
                ${request.budget.toLocaleString()}
              </p>
            </div>
          )}
          {request.timeline && (
            <div>
              <p className='font-mono text-xs text-green-300/60 uppercase'>
                Timeline
              </p>
              <p className='font-mono text-sm text-green-300'>
                {request.timeline}
              </p>
            </div>
          )}
          <div>
            <p className='font-mono text-xs text-green-300/60 uppercase'>
              Submitted
            </p>
            <p className='font-mono text-sm text-green-300'>
              {formatCardDate(request.createdAt)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className='rounded-lg border border-green-400/20 bg-black/60 p-4'>
          <h2 className='mb-2 font-mono text-sm font-bold text-green-300'>
            Description
          </h2>
          <p className='font-mono text-sm text-green-300/80'>
            {request.description}
          </p>
        </div>

        {/* Features */}
        {request.features && request.features.length > 0 && (
          <div className='rounded-lg border border-green-400/20 bg-black/60 p-4'>
            <h2 className='mb-2 font-mono text-sm font-bold text-green-300'>
              Features
            </h2>
            <FeatureList features={request.features} />
          </div>
        )}

        {/* Additional Info */}
        {request.additionalInfo && (
          <div className='rounded-lg border border-green-400/20 bg-black/60 p-4'>
            <h2 className='mb-2 font-mono text-sm font-bold text-green-300'>
              Additional Info
            </h2>
            <p className='font-mono text-sm text-green-300/80'>
              {request.additionalInfo}
            </p>
          </div>
        )}

        {/* Status Updates */}
        {request.statusUpdates && request.statusUpdates.length > 0 && (
          <div className='rounded-lg border border-green-400/20 bg-black/60 p-4'>
            <h2 className='mb-3 font-mono text-sm font-bold text-green-300'>
              Updates
            </h2>
            <div className='space-y-3'>
              {request.statusUpdates.map((update) => (
                <div
                  key={update.id}
                  className='border-l-2 border-green-400/30 pl-3'
                >
                  <div className='flex items-center gap-2'>
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-xs font-bold uppercase ${getStatusCardStyling(update.newStatus || 'unknown')}`}
                    >
                      {formatStatus(update.newStatus || 'unknown')}
                    </span>
                    <span className='font-mono text-xs text-green-300/50'>
                      {formatCardDate(update.createdAt)}
                    </span>
                  </div>
                  {update.updateMessage && (
                    <p className='mt-1 font-mono text-xs text-green-300/70'>
                      {update.updateMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
