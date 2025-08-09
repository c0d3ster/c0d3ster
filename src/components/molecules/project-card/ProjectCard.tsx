'use client'

import Image from 'next/image'

export type Project = {
  title: string
  description: string
  tech: string[]
  status: string
  logo?: string
}

type ProjectCardProps = {
  project: Project
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <div className='group relative rounded-lg border border-green-400/20 bg-black/80 p-6 transition-all duration-300 hover:border-green-400/40 hover:bg-green-400/5'>
      {/* Logo in top right */}
      {project.logo && (
        <div className='absolute top-4 right-4'>
          <Image
            src={project.logo}
            alt={`${project.title} logo`}
            width={60}
            height={60}
            className='opacity-70 transition-opacity duration-300 group-hover:opacity-100'
          />
        </div>
      )}

      {/* Project Title */}
      <h3 className='mb-2 pr-12 font-mono text-lg font-bold text-green-400'>
        {project.title}
      </h3>

      {/* Project Description */}
      <p className='mb-4 pr-12 font-mono text-sm text-green-300 opacity-80'>
        {project.description}
      </p>

      {/* Tech Stack */}
      <div className='mb-4 flex flex-wrap gap-1'>
        {project.tech.map((tech) => (
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
          className={`font-mono text-xs font-bold ${
            project.status === 'COMPLETED'
              ? 'text-green-400'
              : 'text-yellow-400'
          }`}
        >
          {project.status}
        </span>

        {/* Matrix-style decorative elements */}
        <div className='absolute right-[37px] bottom-6 flex space-x-1'>
          <div className='h-4 w-1 bg-green-400 opacity-20' />
          <div className='h-4 w-1 bg-green-500 opacity-40' />
          <div className='h-4 w-1 bg-green-300 opacity-20' />
        </div>
      </div>
    </div>
  )
}
