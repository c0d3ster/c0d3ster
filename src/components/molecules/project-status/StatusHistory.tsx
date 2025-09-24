'use client'

import type { StatusUpdate } from '@/graphql/generated/graphql'

import {
  formatStatus,
  formatStatusDate,
  getSortableTimestamp,
  getStatusCardStyling,
} from '@/utils'

type StatusHistoryProps = {
  statusUpdates: ReadonlyArray<StatusUpdate | null | undefined>
}

export const StatusHistory = ({ statusUpdates }: StatusHistoryProps) => {
  // Don't render if no status updates
  if (!statusUpdates || statusUpdates.length === 0) {
    return null
  }

  // Filter out null/undefined updates and sort by creation date (oldest first)
  const validUpdates = statusUpdates.filter(
    (update): update is StatusUpdate => update !== null && update !== undefined
  )

  if (validUpdates.length === 0) {
    return null
  }

  const sortedUpdates = [...validUpdates].sort((a, b) => {
    // Use shared utility for consistent date parsing and sorting
    const timestampA = getSortableTimestamp(a.createdAt)
    const timestampB = getSortableTimestamp(b.createdAt)

    return timestampB - timestampA // Most recent first
  })

  return (
    <div className='space-y-4'>
      <h3 className='font-mono text-xl font-bold text-green-400'>
        STATUS HISTORY
      </h3>

      <div className='space-y-3'>
        {sortedUpdates.map((update, index) => {
          const isLast = index === sortedUpdates.length - 1

          // Format date using shared utility
          const formattedDate = formatStatusDate(update.createdAt)

          return (
            <div
              key={update.id}
              className='relative flex items-start space-x-4'
            >
              {/* Timeline line */}
              {!isLast && (
                <div className='absolute top-8 left-4 h-full w-0.5 bg-green-400/20' />
              )}

              {/* Timeline dot */}
              <div className='relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400/40 bg-green-400/20'>
                <div className='h-2 w-2 rounded-full bg-green-400' />
              </div>

              {/* Content */}
              <div className='flex-1 space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  {/* Status badges */}
                  <div className='flex items-center gap-2'>
                    {update.oldStatus && (
                      <>
                        <span
                          className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${getStatusCardStyling(update.oldStatus)}`}
                        >
                          {formatStatus(update.oldStatus)}
                        </span>
                        <span className='text-green-400/60'>→</span>
                      </>
                    )}
                    <span
                      className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${getStatusCardStyling(update.newStatus)}`}
                    >
                      {formatStatus(update.newStatus)}
                    </span>
                  </div>

                  {/* Progress percentage */}
                  {update.progressPercentage !== null &&
                    update.progressPercentage !== undefined && (
                      <span className='rounded border border-green-400/30 bg-green-400/10 px-2 py-1 font-mono text-xs text-green-400'>
                        {update.progressPercentage}%
                      </span>
                    )}
                </div>

                {/* Update message */}
                <p className='font-mono text-sm text-green-300/80'>
                  {update.updateMessage}
                </p>

                {/* Update details */}
                <div className='flex flex-wrap items-center gap-4 text-xs text-green-400/60'>
                  <span>{formattedDate}</span>
                  {update.updatedByUser && (
                    <span>
                      by {update.updatedByUser.firstName}{' '}
                      {update.updatedByUser.lastName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
