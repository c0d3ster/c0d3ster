import type { Metadata } from 'next'

import {
  ContactSection,
  HeroSection,
  ProjectsPreviewSection,
} from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `${BRAND_NAME} - Software Contractor`,
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
