'use client'

import type { ProjectDisplay } from '@/graphql/generated/graphql'

import { Button, ScrollFade } from '@/components/atoms'

type ProjectCardProps = {
  project: ProjectDisplay
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const {
    projectName,
    title,
    description,
    overview,
    techStack,
    status,
    liveUrl,
    repositoryUrl,
    featured,
  } = project

  return (
    <ScrollFade>
      <div className='group relative overflow-hidden rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-400/40 hover:bg-black/80'>
        {/* Featured Badge */}
        {featured && (
          <div className='absolute top-4 right-4'>
            <span className='inline-flex rounded-full bg-yellow-400/20 px-2 py-1 font-mono text-xs font-bold text-yellow-400'>
              ⭐ FEATURED
            </span>
          </div>
        )}

        {/* Project Header */}
        <div className='mb-4'>
          <h3 className='mb-2 font-mono text-lg font-bold text-green-400'>
            {title || projectName}
          </h3>
          <p className='font-mono text-sm text-green-300/80'>
            {overview || description}
          </p>
        </div>

        {/* Tech Stack */}
        {techStack && techStack.length > 0 && (
          <div className='mb-4'>
            <h4 className='mb-2 font-mono text-xs font-bold tracking-wide text-blue-400 uppercase'>
              Tech Stack
            </h4>
            <div className='flex flex-wrap gap-2'>
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className='rounded border border-blue-400/30 bg-blue-400/10 px-2 py-1 font-mono text-xs font-bold text-blue-400'
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className='mb-4'>
          <span className='inline-flex rounded-full bg-green-400/10 px-3 py-1 font-mono text-xs font-bold text-green-400'>
            {status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          {liveUrl && (
            <Button href={liveUrl} size='sm' className='flex-1'>
              🌐 LIVE SITE
            </Button>
          )}
          {repositoryUrl && (
            <Button href={repositoryUrl} size='sm' className='flex-1'>
              📁 CODE
            </Button>
          )}
        </div>

        {/* Hover Effect */}
        <div className='absolute inset-0 rounded-lg border-2 border-transparent opacity-0 transition-all duration-300 group-hover:border-green-400/40 group-hover:opacity-100' />
      </div>
    </ScrollFade>
  )
}
