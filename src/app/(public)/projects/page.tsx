import type { Metadata } from 'next'

import { getProjects } from '@/apiClients'
import { ExpandingUnderline, ScrollFade } from '@/components/atoms'
import { AnimatedHeading, ProjectCard } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME, SUPPORT_EMAIL } from '@/constants'

export const metadata: Metadata = {
  title: `All Projects - ${BRAND_NAME}`,
  description:
    'Complete project portfolio showcasing full-stack development work',
}

export default async function Portfolio() {
  const projects = await getProjects(undefined, SUPPORT_EMAIL)

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
        {projects && projects.length > 0 ? (
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {projects.map((project) => (
              <ScrollFade key={project.projectName}>
                <ProjectCard project={project} />
              </ScrollFade>
            ))}
          </div>
        ) : (
          <div className='text-center'>
            <p className='font-mono text-lg text-gray-400 opacity-80'>
              NO PROJECTS AVAILABLE
            </p>
          </div>
        )}
      </div>
    </CleanPageTemplate>
  )
}
