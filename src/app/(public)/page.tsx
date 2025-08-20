import type { Metadata } from 'next'

import {
  ContactSection,
  HeroSection,
  ProjectsPreviewSection,
} from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'c0d3ster - Software Contractor',
  description:
    'Full-stack software development contractor specializing in React, Next.js, TypeScript, and Node.js',
}

export default function Index() {
  return (
    <LandingPageTemplate>
      <HeroSection />
      <ProjectsPreviewSection />
      <ContactSection />
    </LandingPageTemplate>
  )
}
