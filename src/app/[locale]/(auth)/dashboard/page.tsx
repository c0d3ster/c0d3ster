import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { ExpandingUnderline, UserProfile } from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  })

  return {
    title: t('meta_title'),
  }
}

export default function Dashboard() {
  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl'>
          {/* Header Section */}
          <div className='mb-16 text-center'>
            <AnimatedHeading
              text='DASHBOARD'
              level='h1'
              variant='section'
              className='mb-4'
            />
            <ExpandingUnderline />

            <p className='mt-6 font-mono text-base text-green-300/80'>
              Welcome to your command center. Manage your profile and account
              settings below.
            </p>
          </div>

          {/* User Profile Section */}
          <div className='mb-6 rounded-lg border border-green-400/20 bg-black/80 p-6 shadow-2xl backdrop-blur-sm'>
            <UserProfile />
          </div>

          {/* Additional Dashboard Features */}
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Quick Stats */}
            <div className='rounded-lg border border-green-400/20 bg-black/60 p-4 backdrop-blur-sm'>
              <h3 className='mb-3 font-mono text-lg font-bold text-green-400'>
                QUICK STATS
              </h3>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='font-mono text-sm text-green-300'>
                    Status:
                  </span>
                  <span className='font-mono text-sm text-green-400'>
                    ONLINE
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-mono text-sm text-green-300'>
                    Member Since:
                  </span>
                  <span className='font-mono text-sm text-green-400'>
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='rounded-lg border border-green-400/20 bg-black/60 p-4 backdrop-blur-sm'>
              <h3 className='mb-3 font-mono text-lg font-bold text-green-400'>
                QUICK ACTIONS
              </h3>
              <div className='space-y-2'>
                <button
                  type='button'
                  className='w-full rounded border border-green-400/30 bg-green-400/10 px-3 py-2 font-mono text-xs text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
                >
                  VIEW SETTINGS
                </button>
                <button
                  type='button'
                  className='w-full rounded border border-green-400/30 bg-green-400/10 px-3 py-2 font-mono text-xs text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
                >
                  MANAGE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CleanPageTemplate>
  )
}
