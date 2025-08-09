import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { CleanPageTemplate, SiteHeader } from '@/components'
import { routing } from '@/libs/I18nRouting'

type IPortfolioDetailProps = {
  params: Promise<{ slug: string; locale: string }>
}

export function generateStaticParams() {
  return routing.locales
    .map((locale) =>
      Array.from(Array.from({ length: 6 }).keys()).map((elt) => ({
        slug: `${elt}`,
        locale,
      }))
    )
    .flat(1)
}

export async function generateMetadata(
  props: IPortfolioDetailProps
): Promise<Metadata> {
  const { locale, slug } = await props.params
  const t = await getTranslations({
    locale,
    namespace: 'PortfolioSlug',
  })

  return {
    title: t('meta_title', { slug }),
    description: t('meta_description', { slug }),
  }
}

export default async function PortfolioDetail(props: IPortfolioDetailProps) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)

  return (
    <CleanPageTemplate>
      <SiteHeader />
      <div className='container mx-auto px-4 py-16 pt-32'>
        <div className='text-center'>
          <h1 className='mb-8 font-mono text-4xl font-bold text-green-400 capitalize'>
            Project {slug}
          </h1>
          <p className='font-mono text-lg text-green-300 opacity-80'>
            Coming soon - individual project details will be implemented here
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
    </CleanPageTemplate>
  )
}

export const dynamicParams = false
