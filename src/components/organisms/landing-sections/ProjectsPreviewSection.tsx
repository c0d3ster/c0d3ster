'use client'

import type { Project } from '@/components/molecules'

import {
  Button,
  ExpandingUnderline,
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading, ProjectCard } from '@/components/molecules'
import { defaultFeaturedProjects } from '@/data/projects'

type ProjectsPreviewSectionProps = {
  featuredProjects?: Project[]
}

export const ProjectsPreviewSection = ({
  featuredProjects = defaultFeaturedProjects,
}: ProjectsPreviewSectionProps) => {
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
      <div className='mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {featuredProjects.map((project) => (
          <ScrollFade key={project.overview}>
            <ProjectCard project={project} />
          </ScrollFade>
        ))}
      </div>

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
