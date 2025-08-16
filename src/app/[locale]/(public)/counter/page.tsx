import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: 'Counter',
  })

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  }
}

export default function Counter() {
  return (
    <div className='text-center'>
      <h1 className='mb-4 text-2xl font-bold'>Counter</h1>
      <p className='text-gray-600'>This page is under construction.</p>
    </div>
  )
}
