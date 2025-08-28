import type { Metadata } from 'next'

import { ExpandingUnderline } from '@/components/atoms'
import { AnimatedHeading, ProjectRequestForm } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Request Project - ${BRAND_NAME}`,
  description: 'Submit a new project request',
}

export default function RequestProjectPage() {
  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl'>
          {/* Header Section */}
          <div className='mb-16 text-center'>
            <AnimatedHeading
              text='REQUEST PROJECT'
              level='h1'
              variant='section'
              className='mb-4'
            />
            <ExpandingUnderline />

            <p className='mt-6 font-mono text-base text-green-300/80'>
              Tell us about your project and we'll get back to you with a
              detailed proposal.
            </p>
          </div>

          {/* Form Section */}
          <div className='rounded-lg border border-green-400/20 bg-black/80 p-8 shadow-2xl backdrop-blur-sm'>
            <ProjectRequestForm />
          </div>
        </div>
      </div>
    </CleanPageTemplate>
  )
}
