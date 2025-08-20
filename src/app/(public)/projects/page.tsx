import type { Metadata } from 'next'

import { ExpandingUnderline, ScrollFade } from '@/components/atoms'
import { AnimatedHeading, ProjectCard } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { defaultFeaturedProjects } from '@/data/projects'

export const metadata: Metadata = {
  title: 'All Projects - c0d3ster',
  description:
    'Complete project portfolio showcasing full-stack development work',
}

export default function Portfolio() {
  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        {/* Page Header */}
        <ScrollFade>
          <div className='mb-16 text-center'>
            <AnimatedHeading
              text='ALL PROJECTS'
              level='h1'
              variant='section'
              className='mb-4'
            />
            <ExpandingUnderline />
            <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
              COMPLETE PROJECT PORTFOLIO
            </p>
          </div>
        </ScrollFade>

        {/* Projects Grid */}
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {defaultFeaturedProjects.map((project) => (
            <ScrollFade key={project.overview}>
              <ProjectCard project={project} />
            </ScrollFade>
          ))}
        </div>
      </div>
    </CleanPageTemplate>
  )
}
