import type { Metadata } from 'next'

import { ExpandingUnderline } from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { DashboardContent } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Dashboard - ${BRAND_NAME}`,
}

export default function Dashboard() {
  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-6xl'>
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
              Welcome to your command center. View your projects and manage your
              account.
            </p>
          </div>

          {/* Dashboard Content */}
          <DashboardContent />
        </div>
      </div>
    </CleanPageTemplate>
  )
}
