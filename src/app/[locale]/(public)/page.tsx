import type { Metadata } from 'next'

import { setRequestLocale } from 'next-intl/server'

import {
  ContactSection,
  HeroSection,
  ProjectsPreviewSection,
} from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'

type IIndexProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'c0d3ster - Software Contractor',
    description:
      'Full-stack software development contractor specializing in React, Next.js, TypeScript, and Node.js',
  }
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params
  setRequestLocale(locale)

  return (
    <LandingPageTemplate>
      <HeroSection />
      <ProjectsPreviewSection />
      <ContactSection />
    </LandingPageTemplate>
  )
}
