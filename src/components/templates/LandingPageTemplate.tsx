'use client'

import { MatrixBackground } from '@/components/atoms'

type LandingPageTemplateProps = {
  children: React.ReactNode
}

export const LandingPageTemplate = ({ children }: LandingPageTemplateProps) => {
  return (
    <>
      <MatrixBackground />
      <div className='relative min-h-screen'>{children}</div>
    </>
  )
}
