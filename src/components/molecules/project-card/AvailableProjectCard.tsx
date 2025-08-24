'use client'

import { useState } from 'react'

import type { GetAvailableProjectsDetailedQuery } from '@/graphql/generated/graphql'

type AvailableProject = NonNullable<
  GetAvailableProjectsDetailedQuery['availableProjects']
>[0]

type AvailableProjectCardProps = {
  project: AvailableProject
  onAssign: (projectId: string) => Promise<void>
}

export const AvailableProjectCard = ({
  project,
  onAssign,
}: AvailableProjectCardProps) => {
  const [isAssigning, setIsAssigning] = useState(false)

  const handleAssign = async () => {
    try {
      setIsAssigning(true)
      await onAssign(project.id)
    } catch (error) {
      console.error('Failed to assign to project:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const clientName =
    `${project.client.firstName || ''} ${project.client.lastName || ''}`.trim() ||
    'Unknown Client'

  return (
    <div className='flex h-full min-h-[300px] flex-col rounded-lg border border-blue-400/20 bg-black/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 hover:bg-black/80'>
      {/* Header */}
      <div className='mb-3 flex items-start justify-between'>
        <h3 className='font-mono text-lg font-bold text-blue-400'>
          {project.title}
        </h3>
        <span className='rounded border border-blue-400/30 bg-blue-400/10 px-2 py-1 font-mono text-xs font-bold text-blue-400 uppercase'>
          {project.status}
        </span>
      </div>

      {/* Client Information */}
      <div className='mb-3 rounded border border-blue-400/20 bg-blue-400/5 p-2'>
        <p className='font-mono text-xs text-blue-400'>
          <span className='text-blue-400/60'>Client:</span> {clientName}
        </p>
        <p className='font-mono text-xs text-blue-400/80'>
          {project.client.email}
        </p>
      </div>

      {/* Description */}
      <p className='mb-4 line-clamp-3 font-mono text-sm text-blue-300/80'>
        {project.description}
      </p>

      {/* Project Details */}
      <div className='mb-4 flex-1 space-y-2'>
        <div className='flex justify-between font-mono text-xs'>
          <span className='text-blue-300/60'>Type:</span>
          <span className='text-blue-400'>{project.projectType}</span>
        </div>

        {project.budget && (
          <div className='flex justify-between font-mono text-xs'>
            <span className='text-blue-300/60'>Budget:</span>
            <span className='text-blue-400'>${project.budget}</span>
          </div>
        )}

        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <div className='space-y-1'>
            <span className='font-mono text-xs text-blue-300/60'>
              Tech Stack:
            </span>
            <div className='flex flex-wrap gap-1'>
              {(project.techStack ?? [])
                .filter((t): t is string => Boolean(t))
                .slice(0, 3)
                .map((tech: string) => (
                  <span
                    key={tech}
                    className='rounded bg-blue-400/20 px-2 py-1 font-mono text-xs text-blue-400'
                  >
                    {tech}
                  </span>
                ))}
              {(project.techStack?.filter(Boolean).length ?? 0) > 3 && (
                <span className='rounded bg-blue-400/10 px-2 py-1 font-mono text-xs text-blue-400/60'>
                  +{(project.techStack?.filter(Boolean).length ?? 0) - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign Button */}
      <button
        type='button'
        onClick={handleAssign}
        disabled={isAssigning}
        className='w-full rounded border border-blue-400/30 bg-blue-400/10 px-4 py-3 font-mono text-sm font-bold text-blue-400 transition-all duration-300 hover:bg-blue-400 hover:text-black disabled:opacity-50'
      >
        {isAssigning ? 'ASSIGNING...' : '🚀 ASSIGN TO ME'}
      </button>
    </div>
  )
}
