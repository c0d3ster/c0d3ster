'use client'

import type { Project } from '@/components/molecules'
import Image from 'next/image'
import { BackButton, ExpandingUnderline, ScrollFade } from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { CleanPageTemplate } from './CleanPageTemplate'

type ProjectDetailsTemplateProps = {
  project: Project
}

export const ProjectDetailsTemplate = ({
  project,
}: ProjectDetailsTemplateProps) => {
  return (
    <CleanPageTemplate>
      <BackButton href='/projects' text='BACK TO PROJECTS' />
      <div className='container mx-auto px-4 py-16 pt-32'>
        {/* Project Header */}
        <ScrollFade>
          <div className='mb-16 text-center'>
            <AnimatedHeading
              text={project.projectName || project.title}
              level='h1'
              variant='section'
              className='mb-4'
            />
            <ExpandingUnderline />
            <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
              {project.title}
            </p>
            <p className='mt-4 font-mono text-base text-green-400 opacity-70'>
              {project.overview}
            </p>
          </div>
        </ScrollFade>

        {/* Project Content */}
        <div className='grid gap-12 lg:grid-cols-2'>
          {/* Project Logo and Visual */}
          <ScrollFade>
            <div className='flex flex-col items-center space-y-8'>
              {project.logo && (
                <div className='relative'>
                  <Image
                    src={project.logo}
                    alt={`${project.title} logo`}
                    width={300}
                    height={300}
                    className='rounded-lg border border-green-400/20 bg-black/80 p-8'
                  />
                </div>
              )}

              {/* Status Badge */}
              <div className='text-center'>
                <span
                  className={`inline-block rounded-full px-6 py-3 font-mono text-sm font-bold ${
                    project.status === 'COMPLETED'
                      ? 'border border-green-400/40 bg-green-400/20 text-green-400'
                      : 'border border-yellow-400/40 bg-yellow-400/20 text-yellow-400'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          </ScrollFade>

          {/* Project Details */}
          <ScrollFade>
            <div className='space-y-8'>
              {/* Tech Stack */}
              <div>
                <h3 className='mb-4 font-mono text-xl font-bold text-green-400'>
                  TECHNOLOGIES USED
                </h3>
                <div className='flex flex-wrap gap-3'>
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className='rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm text-green-400'
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project Description */}
              <div>
                <h3 className='mb-4 font-mono text-xl font-bold text-green-400'>
                  PROJECT DETAILS
                </h3>
                <p className='font-mono leading-relaxed text-green-300 opacity-90'>
                  {project.description || 'Project details coming soon...'}
                </p>
              </div>
            </div>
          </ScrollFade>
        </div>

        {/* Access Project Button */}
        {project.projectUrl && (
          <ScrollFade>
            <div className='mt-16 text-center'>
              <a
                href={project.projectUrl}
                target={
                  project.projectUrl.startsWith('http') ? '_blank' : '_self'
                }
                rel={
                  project.projectUrl.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
                className='inline-block rounded border border-green-400 bg-green-400 px-8 py-3 font-mono font-bold text-black transition-all duration-300 hover:border-green-500 hover:bg-green-500'
              >
                ACCESS PROJECT
              </a>
            </div>
          </ScrollFade>
        )}
      </div>
    </CleanPageTemplate>
  )
}
