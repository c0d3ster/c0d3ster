'use client'

import dynamic from 'next/dynamic'

const MatrixBackground = dynamic(
  () => import('@/components/atoms').then((m) => ({ default: m.MatrixBackground })),
  { ssr: false }
)

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
