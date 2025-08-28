'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { GetFeaturedProjectsQuery } from '@/graphql/generated/graphql'

type Project = NonNullable<GetFeaturedProjectsQuery['featuredProjects']>[0]

type ProjectCardProps = {
  project: Project
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  // Generate slug from project title or projectName
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.toUpperCase())
      .join(' ')
  }

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'in_progress':
      case 'in_testing':
      case 'ready_for_launch':
        return 'text-yellow-400'
      case 'requested':
      case 'in_review':
      case 'approved':
        return 'text-blue-400'
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  // Use liveUrl if available, otherwise generate from project name
  const getProjectUrl = (projectName?: string) => {
    if (!projectName) return '/projects'

    const slug = generateSlug(projectName)
    return `/projects/${slug}`
  }

  const projectUrl = project.liveUrl || getProjectUrl(project.projectName)

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

          {/* Matrix-style decorative elements */}
          <div className='absolute right-[37px] bottom-6 flex space-x-1'>
            <div className='h-4 w-1 bg-green-400 opacity-20' />
            <div className='h-4 w-1 bg-green-500 opacity-40' />
            <div className='h-4 w-1 bg-green-300 opacity-20' />
          </div>
        </div>
      </div>
    </Link>
  )
}
