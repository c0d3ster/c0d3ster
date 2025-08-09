'use client'

import type { Project } from '@/components/molecules'
import Link from 'next/link'
import {
  ExpandingUnderline,
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading, ProjectCard } from '@/components/molecules'

type ProjectsPreviewSectionProps = {
  featuredProjects?: Project[]
}

const defaultFeaturedProjects: Project[] = [
  {
    title: 'Cross-Platform 3D Game',
    description: 'Multi-platform 3D action game built with Unity Engine',
    tech: ['Unity', 'C#', 'Firebase', '3D Graphics'],
    status: 'IN PROGRESS',
    logo: '/assets/images/BALLZLogo.png',
  },
  {
    title: 'AI Generation Platform',
    description: 'Advanced AI-powered platform for creating videos and images',
    tech: ['React', 'TypeScript', 'LoRAs', 'ML Models'],
    status: 'COMPLETED',
    logo: '/assets/images/KaiberLogo.png',
  },
  {
    title: 'Interactive Audio Visualizer',
    description:
      'Fully customizable audio-reactive visualizer with real-time effects',
    tech: ['Three.js', 'MongoDB', 'WebGL', 'Audio API'],
    status: 'COMPLETED',
    logo: '/assets/images/FractaleyezLogo.png',
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
            <ProjectCard project={project} />
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
