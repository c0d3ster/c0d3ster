import type { Metadata } from 'next'

import Link from 'next/link'

import { CompactUserProfile, ExpandingUnderline } from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'Dashboard - c0d3ster',
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

          {/* User Overview Section */}
          <div className='mb-8 rounded-lg border border-green-400/20 bg-black/80 p-6 shadow-2xl backdrop-blur-sm'>
            <div className='flex items-center justify-between'>
              {/* Left: Compact User Profile */}
              <div className='flex-1'>
                <CompactUserProfile />
              </div>

              {/* Right: Quick Stats */}
              <div className='ml-8 flex-shrink-0'>
                <div className='text-right'>
                  <div className='mb-2 flex items-center justify-end space-x-3'>
                    <span className='font-mono text-sm text-green-300'>
                      Status:
                    </span>
                    <span className='inline-flex rounded-full bg-green-400/20 px-3 py-1 font-mono text-xs font-bold text-green-400'>
                      ONLINE
                    </span>
                  </div>
                  <div className='flex items-center justify-end space-x-3'>
                    <span className='font-mono text-sm text-green-300'>
                      Projects:
                    </span>
                    <span className='font-mono text-sm font-bold text-green-400'>
                      0 Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='mb-8 rounded-lg border border-green-400/20 bg-black/60 p-6 backdrop-blur-sm'>
            <h3 className='mb-4 font-mono text-lg font-bold text-green-400'>
              QUICK ACTIONS
            </h3>
            <div className='grid gap-3 md:grid-cols-2'>
              <Link
                href='/dashboard/request-project'
                className='block rounded border border-green-400/30 bg-green-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
              >
                📝 REQUEST NEW PROJECT
              </Link>
              <Link
                href='/dashboard/user-profile'
                className='block rounded border border-green-400/30 bg-green-400/10 px-4 py-3 text-center font-mono text-sm font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
              >
                ⚙️ MANAGE ACCOUNT
              </Link>
            </div>
          </div>

          {/* Projects Section - Placeholder */}
          <div className='rounded-lg border border-green-400/20 bg-black/40 p-6 backdrop-blur-sm'>
            <h3 className='mb-4 font-mono text-lg font-bold text-green-400'>
              YOUR PROJECTS
            </h3>
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className='mb-4 text-4xl'>🚀</div>
              <p className='mb-2 font-mono text-sm text-green-300'>
                No projects yet
              </p>
              <p className='font-mono text-xs text-green-300/60'>
                Start by requesting your first project above
              </p>
            </div>
          </div>
        </div>
      </div>
    </CleanPageTemplate>
  )
}
