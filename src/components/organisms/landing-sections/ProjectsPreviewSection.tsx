'use client'

import type { ProjectDisplayFragment } from '@/graphql/generated/graphql'

import { useGetFeaturedProjects } from '@/apiClients'
import {
  Button,
  ExpandingUnderline,
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading, ProjectCard } from '@/components/molecules'
import { SUPPORT_EMAIL } from '@/constants'

export const ProjectsPreviewSection = () => {
  const { data, loading, error } = useGetFeaturedProjects(SUPPORT_EMAIL)

  const featuredProjects = data?.featuredProjects || []

  if (loading) {
    return (
      <SectionWrapper id='portfolio'>
        <div className='mt-12 mb-16 text-center'>
          <AnimatedHeading
            text='FEATURED PROJECTS'
            level='h2'
            variant='section'
            className='mb-4'
          />
          <ExpandingUnderline />
          <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
            LOADING PROJECTS...
          </p>
        </div>
      </SectionWrapper>
    )
  }

  if (error) {
    return (
      <SectionWrapper id='portfolio'>
        <div className='mt-12 mb-16 text-center'>
          <AnimatedHeading
            text='FEATURED PROJECTS'
            level='h2'
            variant='section'
            className='mb-4'
          />
          <ExpandingUnderline />
          <p className='mt-6 font-mono text-lg text-red-300 opacity-80'>
            ERROR LOADING PROJECTS
          </p>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper id='portfolio'>
      {/* Section Header */}
      <ScrollFade>
        <div className='mt-12 mb-16 text-center'>
          <AnimatedHeading
            text='FEATURED PROJECTS'
            level='h2'
            variant='section'
            className='mb-4'
          />
          <ExpandingUnderline />
          <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
            INDIVIDUAL PROJECT SHOWCASE
          </p>
        </div>
      </ScrollFade>

      {/* Projects Grid */}
      {featuredProjects.length > 0 ? (
        <div className='mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {featuredProjects.map(
            (project: ProjectDisplayFragment) => (
              <ScrollFade key={project.projectName}>
                <ProjectCard project={project} />
              </ScrollFade>
            )
          )}
        </div>
      ) : (
        <div className='mb-12 text-center'>
          <p className='font-mono text-lg text-gray-400 opacity-80'>
            NO FEATURED PROJECTS AVAILABLE
          </p>
        </div>
      )}

      {/* View All Projects Button */}
      <ScrollFade>
        <div className='text-center'>
          <Button href='/projects' size='md'>
            VIEW ALL PROJECTS
          </Button>
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
