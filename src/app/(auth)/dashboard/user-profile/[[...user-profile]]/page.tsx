import type { Metadata } from 'next'

import { ExpandingUnderline } from '@/components/atoms'
import { AnimatedHeading, UserProfile } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'User Profile - c0d3ster',
}

export default function UserProfilePage() {
  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl'>
          {/* Header Section */}
          <div className='mb-8 text-center'>
            <AnimatedHeading text='USER PROFILE' level='h1' className='mb-4' />
            <ExpandingUnderline className='mx-auto mb-4' />
            <p className='font-mono text-base text-green-300/80'>
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
