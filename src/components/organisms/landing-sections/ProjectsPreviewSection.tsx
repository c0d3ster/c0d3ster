'use client'

import Link from 'next/link'
import {
  ExpandingUnderline,
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'

type Project = {
  title: string
  description: string
  tech: string[]
  status: string
}

type ProjectsPreviewSectionProps = {
  featuredProjects?: Project[]
}

const defaultFeaturedProjects: Project[] = [
  {
    title: 'E-Commerce Platform',
    description: 'Full-stack React/Next.js application with TypeScript',
    tech: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    status: 'COMPLETED',
  },
  {
    title: 'Real-time Dashboard',
    description: 'Analytics dashboard with real-time data visualization',
    tech: ['React', 'Node.js', 'Socket.io', 'Chart.js'],
    status: 'IN PROGRESS',
  },
  {
    title: 'API Gateway',
    description: 'Microservices architecture with authentication',
    tech: ['Node.js', 'Express', 'JWT', 'MongoDB'],
    status: 'COMPLETED',
  },
]

export const ProjectsPreviewSection = ({
  featuredProjects = defaultFeaturedProjects,
}: ProjectsPreviewSectionProps) => {
  return (
    <SectionWrapper id='portfolio'>
      {/* Section Header */}
      <ScrollFade>
        <div className='mt-12 mb-16 text-center'>
          <AnimatedHeading
            text='PORTFOLIO'
            level='h2'
            variant='section'
            className='mb-4'
          />
          <ExpandingUnderline />
          <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
            HIGHLIGHTED PROJECT SHOWCASE
          </p>
        </div>
      </ScrollFade>

      {/* Projects Grid */}
      <div className='mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {featuredProjects.map((project) => (
          <ScrollFade key={project.title}>
            <div className='group rounded-lg border border-green-400/20 bg-black/80 p-6 transition-all duration-300 hover:border-green-400/40 hover:bg-green-400/5'>
              {/* Project Title */}
              <h3 className='mb-2 font-mono text-lg font-bold text-green-400'>
                {project.title}
              </h3>

              {/* Project Description */}
              <p className='mb-4 font-mono text-sm text-green-300 opacity-80'>
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
                <div className='flex space-x-1'>
                  <div className='h-4 w-1 bg-green-400 opacity-20' />
                  <div className='h-4 w-1 bg-green-500 opacity-40' />
                  <div className='h-4 w-1 bg-green-300 opacity-20' />
                </div>
              </div>
            </div>
          </ScrollFade>
        ))}
      </div>

      {/* View All Projects Button */}
      <ScrollFade>
        <div className='text-center'>
          <Link
            href='/projects'
            className='inline-block rounded border border-green-400 bg-green-400/10 px-8 py-3 font-mono font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
          >
            VIEW ALL PROJECTS
          </Link>
        </div>
      </ScrollFade>

      {/* Additional Matrix-style info */}
      <ScrollFade>
        <div className='mt-16 text-center font-mono text-sm text-green-600 opacity-40'>
          <p>
            <TypewriterEffect
              text={`PROJECTS LOADED: ${featuredProjects.length}`}
              speed={65}
            />
          </p>
          <p>
            <TypewriterEffect text='SUCCESS RATE: 100%' speed={65} />
          </p>
          <p>
            <TypewriterEffect
              text='CLIENT SATISFACTION: EXCELLENT'
              speed={65}
            />
          </p>
        </div>
      </ScrollFade>
    </SectionWrapper>
  )
}
