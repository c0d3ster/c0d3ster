import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { MatrixBackground } from '@/components/MatrixBackground'
import { MatrixHero } from '@/components/MatrixHero'

type IIndexProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'c0d3ster - Software Contractor',
    description: 'Full-stack software development contractor specializing in React, Next.js, TypeScript, and Node.js',
  }
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-black">
      <MatrixBackground />
      <MatrixHero />
    </div>
  )
}
