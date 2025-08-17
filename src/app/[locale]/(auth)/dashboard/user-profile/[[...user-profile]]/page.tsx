import type { Metadata } from 'next'

import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ExpandingUnderline, UserProfile } from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'

type IUserProfilePageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(
  props: IUserProfilePageProps
): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: 'UserProfile',
  })

  return {
    title: t('meta_title'),
  }
}

export default async function UserProfilePage(props: IUserProfilePageProps) {
  const { locale } = await props.params
  setRequestLocale(locale)

  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl'>
          {/* Header Section */}
          <div className='mb-8 text-center'>
            <AnimatedHeading
              text='USER PROFILE'
              className='mb-4 font-mono text-3xl font-bold text-green-400'
            />
            <ExpandingUnderline className='mx-auto mb-4' />
            <p className='text-lg text-green-300/80'>
              Manage your account settings and profile information
            </p>
          </div>

          {/* Profile Content */}
          <div className='rounded-lg border border-green-400/20 bg-black/80 p-6 shadow-2xl backdrop-blur-sm'>
            <UserProfile />
          </div>
        </div>
      </div>
    </CleanPageTemplate>
  )
}
