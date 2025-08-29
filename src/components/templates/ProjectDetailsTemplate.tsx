'use client'

import Image from 'next/image'

import type { Project } from '@/graphql/generated/graphql'

import {
  BackButton,
  Button,
  ExpandingUnderline,
  ScrollFade,
} from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { formatStatus, getStatusCardStyling } from '@/utils'

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
      <div className='container mx-auto px-4'>
        {/* Project Header */}
        <ScrollFade>
          <div className='mb-16 text-center'>
            <AnimatedHeading
              text={project.projectName}
              level='h1'
              variant='section'
              className='mb-4'
            />
            <ExpandingUnderline />
            <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
              {project.title ?? project.projectName}
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
              <div className='relative'>
                {project.logo ? (
                  <Image
                    src={project.logo}
                    alt={`${project.title ?? project.projectName} logo`}
                    width={300}
                    height={300}
                    className='rounded-lg border border-green-400/20 bg-black/80 p-8'
                  />
                ) : (
                  <Image
                    src='/assets/images/c0d3sterLogoPowerNoBackgroundCropped.png'
                    alt='c0d3ster logo'
                    width={300}
                    height={300}
                    className='rounded-lg border border-green-400/20 bg-black/80 p-8 opacity-15'
                  />
                )}
              </div>

              {/* Status Badge */}
              <div className='text-center'>
                <span
                  className={`inline-block rounded-full border px-6 py-3 font-mono text-sm font-bold ${getStatusCardStyling(project.status)}`}
                >
                  {formatStatus(project.status)}
                </span>
              </div>
            </div>
          </ScrollFade>

          {/* Project Details */}
          <ScrollFade>
            <div className='space-y-8'>
              {/* Tech Stack */}
              {(project.techStack ?? []).filter(
                (t: string | null | undefined): t is string => Boolean(t)
              ).length > 0 && (
                <div>
                  <h3 className='mb-4 font-mono text-xl font-bold text-green-400'>
                    TECHNOLOGIES USED
                  </h3>
                  <div className='flex flex-wrap gap-3'>
                    {(project.techStack ?? [])
                      .filter((t: string | null | undefined): t is string =>
                        Boolean(t)
                      )
                      .map((tech: string) => (
                        <span
                          key={tech}
                          className='rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm text-green-400'
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>
              )}

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
        {project.liveUrl && (
          <ScrollFade>
            <div className='mt-16 text-center'>
              <Button
                href={project.liveUrl}
                external={project.liveUrl.startsWith('http')}
                size='md'
              >
                ACCESS PROJECT
              </Button>
            </div>
          </ScrollFade>
        )}
      </div>
    </CleanPageTemplate>
  )
}
