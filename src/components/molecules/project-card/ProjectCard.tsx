'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FaStar } from 'react-icons/fa'

import type { ProjectDisplayFragment } from '@/graphql/generated/graphql'

import { formatStatus, generateSlug, getStatusStyling } from '@/utils'

type ProjectCardProps = {
  project: ProjectDisplayFragment
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  // Generate internal project detail URL
  const getProjectUrl = (projectName?: string) => {
    if (!projectName) return '/projects'

    const slug = generateSlug(projectName)
    return `/projects/${slug}`
  }

  const projectUrl = getProjectUrl(project.projectName)

  return (
    <Link href={projectUrl} className='block'>
      <div className='group relative cursor-pointer rounded-lg border border-green-400/20 bg-black/80 p-6 transition-all duration-300 hover:border-green-400/40 hover:bg-green-400/5'>
        {/* Logo in top right */}
        {project.logo && (
          <div className='absolute top-4 right-4'>
            <Image
              src={project.logo}
              alt={`${project.title ?? project.projectName} logo`}
              width={60}
              height={60}
              className='opacity-70 transition-opacity duration-300 group-hover:opacity-100'
            />
          </div>
        )}

        {/* Project Title */}
        <h3 className='mb-2 pr-12 font-mono text-lg font-bold text-green-400'>
          {project.title || project.projectName}
        </h3>

        {/* Project Description */}
        <p className='mb-4 pr-12 font-mono text-sm text-green-300 opacity-80'>
          {project.overview || project.description}
        </p>

        {/* Tech Stack */}
        <div className='mb-4 flex flex-wrap gap-1'>
          {(project.techStack ?? [])
            .filter((t): t is string => Boolean(t))
            .map((tech: string) => (
              <span
                key={tech}
                className='rounded border border-green-400/30 bg-green-400/10 px-2 py-1 font-mono text-xs text-green-400'
              >
                {tech}
              </span>
            ))}
        </div>

        {/* Status */}
        <div className='flex items-center justify-between'>
          <span
            className={`font-mono text-xs font-bold ${getStatusStyling(project.status)}`}
          >
            {formatStatus(project.status)}
          </span>

          {/* Featured star or matrix-style decorative elements */}
          {project.featured ? (
            <div className='mr-[5px] flex space-x-1'>
              <FaStar className='text-lg text-green-600' />
            </div>
          ) : (
            <div className='mr-1 flex space-x-1'>
              <div className='h-4 w-1 bg-green-400 opacity-20' />
              <div className='h-4 w-1 bg-green-500 opacity-40' />
              <div className='h-4 w-1 bg-green-300 opacity-20' />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
