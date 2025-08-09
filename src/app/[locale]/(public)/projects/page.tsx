import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LandingPageTemplate, SiteHeader } from '@/components'

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
    <LandingPageTemplate>
      <SiteHeader fadeOnScroll={false} />
      <div className='container mx-auto px-4 py-16 pt-32'>
        <div className='text-center'>
          <h1 className='mb-8 font-mono text-5xl font-bold text-green-400 md:text-6xl'>
            ALL PROJECTS
          </h1>
          <p className='font-mono text-lg text-green-300 opacity-80'>
            Coming soon - full projects listing will be implemented here
          </p>
        </div>
      </div>
    </LandingPageTemplate>
  )
}
