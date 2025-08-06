'use client'

import { ScrollAnimatedWrapper, TypewriterEffect } from './animations'

export const MatrixHero = () => {
  return (
    <div
      id='home'
      className='relative flex min-h-screen items-center justify-center py-4 pt-16'
    >
      {/* Main content */}
      <div className='relative z-10 text-center'>
        {/* Main text */}
        <ScrollAnimatedWrapper>
          <h1 className='mb-8 font-mono text-8xl font-bold tracking-wider text-green-400 md:text-9xl'>
            <TypewriterEffect text='c0d3ster' speed={200} keepCursor={true} />
          </h1>
        </ScrollAnimatedWrapper>

        {/* Subtitle */}
        <ScrollAnimatedWrapper>
          <div className='mt-8 space-y-4'>
            <p className='font-mono text-xl text-green-300 md:text-2xl'>
              SOFTWARE CONTRACTOR
            </p>
            <p className='font-mono text-lg text-green-400 opacity-80 md:text-xl'>
              FULL-STACK DEVELOPMENT
            </p>
            <p className='font-mono text-base text-green-500 opacity-60 md:text-lg'>
              REACT • NEXT.JS • TYPESCRIPT • NODE.JS
            </p>
          </div>
        </ScrollAnimatedWrapper>

        {/* Matrix-style decorative elements */}
        <ScrollAnimatedWrapper>
          <div className='mt-12 flex justify-center space-x-8'>
            <div className='h-16 w-1 bg-green-400' />
            <div className='h-16 w-1 bg-green-500' />
            <div className='h-16 w-1 bg-green-300' />
          </div>
        </ScrollAnimatedWrapper>

        {/* Additional Matrix-style info */}
        <ScrollAnimatedWrapper>
          <div className='mt-16 font-mono text-sm text-green-600 opacity-40'>
            <p>
              <TypewriterEffect text='SYSTEM STATUS: ONLINE' speed={50} />
            </p>
            <p>
              <TypewriterEffect text='CONNECTION: SECURE' speed={50} />
            </p>
            <p>
              <TypewriterEffect text='READY FOR DEPLOYMENT' speed={50} />
            </p>
          </div>
        </ScrollAnimatedWrapper>
      </div>
    </div>
  )
}
