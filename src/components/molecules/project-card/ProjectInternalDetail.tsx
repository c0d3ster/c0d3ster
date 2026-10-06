'use client'

import Link from 'next/link'

import { useGetProjectById } from '@/apiClients/projectApiClient'
import { formatCardDate } from '@/utils'
import { formatStatus, getStatusCardStyling } from '@/utils/Project'

type ProjectInternalDetailProps = {
  id: string
}

type MetaItemProps = {
  label: string
  value?: string | null
}

const MetaItem = ({ label, value }: MetaItemProps): React.ReactNode => {
  if (!value) return null

  return (
    <div>
      <p className='font-mono text-xs text-green-300/60 uppercase'>{label}</p>
      <p className='font-mono text-sm text-green-300'>{value}</p>
    </div>
  )
}

export const ProjectInternalDetail = ({
  id,
}: ProjectInternalDetailProps): React.ReactNode => {
  const { data, loading, error } = useGetProjectById(id)

  if (loading) {
    return (
      <div className='py-20 text-center font-mono text-green-400/60'>
        Loading...
      </div>
    )
  }

  if (error || !data?.project) {
    return (
      <div className='py-20 text-center font-mono text-red-400/60'>
        Project not found.{' '}
        <Link
          href='/dashboard'
          className='text-green-400 underline hover:text-green-300'
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const project = data.project

  return (
    <div className='mx-auto max-w-3xl'>
      <div className='mb-8 flex items-start justify-between gap-4'>
        <div>
          <h1 className='font-mono text-2xl font-bold text-green-400'>
            {project.title || project.projectName}
          </h1>
          <p className='mt-1 font-mono text-sm tracking-wide text-green-300/60 uppercase'>
            {project.projectType.replace('_', ' ')}
          </p>
        </div>
        <span
          className={`rounded border px-3 py-1 font-mono text-xs font-bold whitespace-nowrap uppercase ${getStatusCardStyling(project.status)}`}
        >
          {formatStatus(project.status)}
        </span>
      </div>

      <div className='space-y-6'>
        <div className='grid grid-cols-2 gap-4 rounded-lg border border-green-400/20 bg-black/60 p-4'>
          <MetaItem label='Priority' value={project.priority} />
          <MetaItem
            label='Budget'
            value={project.budget ? `$${project.budget.toLocaleString()}` : null}
          />
          <MetaItem
            label='Start Date'
            value={project.startDate ? formatCardDate(project.startDate) : null}
          />
          <MetaItem
            label='Est. Completion'
            value={
              project.estimatedCompletionDate
                ? formatCardDate(project.estimatedCompletionDate)
                : null
            }
          />
          <MetaItem label='Tech Stack' value={project.techStack?.join(', ')} />
        </div>

        <div className='rounded-lg border border-green-400/20 bg-black/60 p-4'>
          <h2 className='mb-2 font-mono text-sm font-bold text-green-300'>
            Internal Notes:
          </h2>
          <p className='text-sm whitespace-pre-wrap text-green-300/80'>
            {project.internalNotes || 'No internal notes.'}
          </p>
        </div>
      </div>
    </div>
  )
}
