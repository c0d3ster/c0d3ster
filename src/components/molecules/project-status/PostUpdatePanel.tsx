'use client'

import { useState } from 'react'

import { useUpdateProjectStatus } from '@/apiClients'
import { Button } from '@/components/atoms'
import { ProjectStatus } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'
import { formatStatus } from '@/utils'

type PostUpdatePanelProps = {
  projectId: string
  currentStatus: ProjectStatus
  currentProgress: number | null | undefined
  onSuccess: () => void
}

const ALL_STATUSES = [
  ProjectStatus.InProgress,
  ProjectStatus.InTesting,
  ProjectStatus.ReadyForLaunch,
  ProjectStatus.Completed,
  ProjectStatus.Cancelled,
]

const READY_FOR_REVIEW_PRESET = {
  status: ProjectStatus.InTesting,
  progressPercentage: 80,
  message: 'Your project is ready for review. Please check the staging environment and share any feedback.',
  isClientVisible: true,
}

const COMPLETED_PRESET = {
  status: ProjectStatus.Completed,
  progressPercentage: 100,
  message: 'Ship it — this one’s wrapped. 100% complete.',
  isClientVisible: true,
}

export const PostUpdatePanel = ({
  projectId,
  currentStatus,
  currentProgress,
  onSuccess,
}: PostUpdatePanelProps) => {
  const [updateProjectStatus, { loading }] = useUpdateProjectStatus()
  const [status, setStatus] = useState<ProjectStatus>(currentStatus)
  const [progress, setProgress] = useState<string>(
    currentProgress != null ? String(currentProgress) : ''
  )
  const [message, setMessage] = useState('')
  const [isClientVisible, setIsClientVisible] = useState(true)

  const applyReadyForReview = () => {
    setStatus(READY_FOR_REVIEW_PRESET.status)
    setProgress(String(READY_FOR_REVIEW_PRESET.progressPercentage))
    setMessage(READY_FOR_REVIEW_PRESET.message)
    setIsClientVisible(READY_FOR_REVIEW_PRESET.isClientVisible)
  }

  const applyCompleted = () => {
    setStatus(COMPLETED_PRESET.status)
    setProgress(String(COMPLETED_PRESET.progressPercentage))
    setMessage(COMPLETED_PRESET.message)
    setIsClientVisible(COMPLETED_PRESET.isClientVisible)
  }

  const handleSubmit = async () => {
    const trimmed = message.trim()

    const parsedProgress = progress !== '' ? Number(progress) : undefined

    try {
      await updateProjectStatus({
        variables: {
          id: projectId,
          status,
          progressPercentage: parsedProgress,
          updateMessage: trimmed || undefined,
          isClientVisible,
        },
      })
      Toast.success('Update posted.')
      setMessage('')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post update.'
      Toast.error(msg)
    }
  }

  return (
    <div className='rounded-lg border border-green-400/20 bg-black/80 p-6'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <h3 className='font-mono text-xl font-bold text-green-400'>
          POST UPDATE
        </h3>
        <div className='flex flex-col sm:items-end'>
          <div className='rounded-lg border border-green-400/25 bg-black/40 p-2'>
            <div className='flex flex-wrap items-stretch gap-2'>
              <button
                type='button'
                onClick={applyReadyForReview}
                className='rounded-md border-2 border-yellow-400/60 bg-yellow-400/10 px-3 py-2 font-mono text-xs font-semibold text-yellow-300 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.12)] transition-colors hover:bg-yellow-400/20 hover:text-yellow-200'
              >
                READY FOR REVIEW
              </button>
              <button
                type='button'
                onClick={applyCompleted}
                className='rounded-md border-2 border-green-400/55 bg-green-400/10 px-3 py-2 font-mono text-xs font-semibold text-green-400 transition-colors hover:bg-green-400/20 hover:text-green-300'
              >
                COMPLETED · 100%
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <label
              htmlFor='post-update-status'
              className='mb-2 block font-mono text-sm text-green-300'
            >
              STATUS
            </label>
            <select
              id='post-update-status'
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className='w-full rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 focus:border-green-400 focus:outline-none'
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatStatus(s)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor='post-update-progress'
              className='mb-2 block font-mono text-sm text-green-300'
            >
              PROGRESS %
            </label>
            <input
              id='post-update-progress'
              type='number'
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder='0 - 100'
              className='w-full rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
            />
          </div>
        </div>

        <div>
          <label
            htmlFor='post-update-message'
            className='mb-2 block font-mono text-sm text-green-300'
          >
            MESSAGE{' '}
            <span className='font-normal text-green-400/50'>(optional)</span>
          </label>
          <textarea
            id='post-update-message'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder='Optional — leave blank to use a default note for this status.'
            className='w-full resize-none rounded border border-green-400/30 bg-black/50 p-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
          />
        </div>

        <div className='flex items-center justify-between'>
          <label className='flex cursor-pointer items-center gap-3 font-mono text-sm text-green-300'>
            <input
              type='checkbox'
              checked={isClientVisible}
              onChange={(e) => setIsClientVisible(e.target.checked)}
              className='h-4 w-4 accent-green-400'
            />
            VISIBLE TO CLIENT
          </label>

          <Button size='sm' onClick={handleSubmit} disabled={loading}>
            {loading ? 'POSTING...' : 'POST UPDATE'}
          </Button>
        </div>
      </div>
    </div>
  )
}
