import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CleanPageTemplate, SiteHeader } from '@/components'
import { ExpandingUnderline, ScrollFade } from '@/components/atoms'
import { AnimatedHeading, ProjectCard } from '@/components/molecules'
import { defaultFeaturedProjects } from '@/data/projects'

type IPortfolioProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(
  props: IPortfolioProps
): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: 'Portfolio',
  })

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  }
}

export default async function Portfolio(props: IPortfolioProps) {
  const { locale } = await props.params
  setRequestLocale(locale)

  return (
    <CleanPageTemplate>
      <SiteHeader fadeOnScroll={false} />
      <div className='container mx-auto px-4 py-16 pt-32'>
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
