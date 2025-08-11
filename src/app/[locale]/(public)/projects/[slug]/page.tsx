import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { ProjectDetailsTemplate, SiteHeader } from '@/components'
import { defaultFeaturedProjects, projectNameToSlug } from '@/data/projects'
import { routing } from '@/libs/I18nRouting'

type IPortfolioDetailProps = {
  params: Promise<{ slug: string; locale: string }>
}

// Create a map of slugs to projects
const projectsData = defaultFeaturedProjects.reduce(
  (acc, project) => {
    if (project.projectName) {
      const slug = projectNameToSlug[project.projectName]
      if (slug) {
        acc[slug] = project
      }
    }
    return acc
  },
  {} as Record<string, (typeof defaultFeaturedProjects)[0]>
)

export function generateStaticParams() {
  return routing.locales
    .map((locale) =>
      Object.keys(projectsData).map((slug) => ({
        slug,
        locale,
      }))
    )
    .flat(1)
}

export async function generateMetadata(
  props: IPortfolioDetailProps
): Promise<Metadata> {
  const { slug } = await props.params
  const project = projectsData[slug]

  if (!project) {
    return {
      title: 'Project Not Found',
      description: 'The requested project could not be found',
    }
  }

  return {
    title: `${project.projectName} - ${project.title} | Portfolio`,
    description: project.overview,
  }
}

export default async function PortfolioDetail(props: IPortfolioDetailProps) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)

  const project = projectsData[slug]

  if (!project) {
    return (
      <div className='min-h-screen bg-black'>
        <SiteHeader />
        <div className='container mx-auto px-4 py-16 pt-32'>
          <div className='text-center'>
            <h1 className='mb-8 font-mono text-4xl font-bold text-green-400'>
              Project Not Found
            </h1>
            <p className='font-mono text-lg text-green-300 opacity-80'>
              The requested project could not be found
            </p>
            <div className='mt-8'>
              <Link
                href='/projects'
                className='inline-block rounded border border-green-400 bg-green-400/10 px-6 py-2 font-mono text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
              >
                ← BACK TO PROJECTS
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SiteHeader fadeOnScroll={false} />
      <ProjectDetailsTemplate project={project} />
    </>
  )
}

export const dynamicParams = false
