'use client'

import { useState } from 'react'

import type { AvailableProject } from '@/hooks/useAvailableProjects'

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'high':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'low':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const clientName =
    `${project.clientFirstName || ''} ${project.clientLastName || ''}`.trim() ||
    'Unknown Client'

  return (
    <div className='flex h-full min-h-[300px] flex-col rounded-lg border border-blue-400/20 bg-black/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 hover:bg-black/80'>
      {/* Header */}
      <div className='mb-3 flex items-start justify-between'>
        <h3 className='font-mono text-lg font-bold text-blue-400'>
          {project.title}
        </h3>
        <span
          className={`rounded border px-2 py-1 font-mono text-xs font-bold uppercase ${getPriorityColor(project.priority)}`}
        >
          {project.priority}
        </span>
      </div>

      {/* Client Information */}
      <div className='mb-3 rounded border border-blue-400/20 bg-blue-400/5 p-2'>
        <p className='font-mono text-xs text-blue-400'>
          <span className='text-blue-400/60'>Client:</span> {clientName}
        </p>
        <p className='font-mono text-xs text-blue-400/80'>{project.clientEmail}</p>
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

        {project.startDate && (
          <div className='flex justify-between font-mono text-xs'>
            <span className='text-blue-300/60'>Start Date:</span>
            <span className='text-blue-400'>{formatDate(project.startDate)}</span>
          </div>
        )}

        {project.estimatedCompletionDate && (
          <div className='flex justify-between font-mono text-xs'>
            <span className='text-blue-300/60'>Due Date:</span>
            <span className='text-blue-400'>{formatDate(project.estimatedCompletionDate)}</span>
          </div>
        )}

        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <div className='space-y-1'>
            <span className='font-mono text-xs text-blue-300/60'>Tech Stack:</span>
            <div className='flex flex-wrap gap-1'>
              {project.techStack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className='rounded bg-blue-400/20 px-2 py-1 font-mono text-xs text-blue-400'
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className='rounded bg-blue-400/10 px-2 py-1 font-mono text-xs text-blue-400/60'>
                  +{project.techStack.length - 3}
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
