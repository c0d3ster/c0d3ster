import type { Metadata } from 'next'

import { setRequestLocale } from 'next-intl/server'

import {
  ContactSection,
  HeroSection,
  LandingPageTemplate,
  ProjectsPreviewSection,
  SiteHeader,
} from '@/components'

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
      <SiteHeader />
      <HeroSection />
      <ProjectsPreviewSection />
      <ContactSection />
    </LandingPageTemplate>
  )
}
