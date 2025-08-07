'use client'

import { useEffect, useState } from 'react'
import { TypewriterEffect } from './animations'
import { ScrollFade } from './animations/ScrollFade'

export const MatrixHero = () => {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate expansion based on scroll position
  const maxScroll = 500 // Maximum scroll distance for full expansion
  const expansionProgress = Math.min(scrollY / maxScroll, 1)
  
  // Use viewport-relative expansion: 1/4 and 3/4 of viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const maxExpansion = viewportWidth * 0.25 // 1/4 of viewport width
  
  const leftBarTransform = `translateX(-${expansionProgress * maxExpansion}px)`
  const rightBarTransform = `translateX(${expansionProgress * maxExpansion}px)`
  return (
    <div
      id='home'
      className='relative flex min-h-screen items-center justify-center px-4 py-4 pt-16'
    >
      {/* Main content */}
      <div className='relative z-10 text-center'>
        {/* Main text */}
        <ScrollFade>
          <h1 className='mb-8 font-mono text-4xl font-bold tracking-wider text-green-400'>
            <TypewriterEffect text='c0d3ster' speed={200} keepCursor={true} className='text-6xl md:text-8xl lg:text-9xl' />
          </h1>
        </ScrollFade>

        {/* Subtitle */}
        <div className='mt-8 space-y-4'>
          <ScrollFade>
            <p className='font-mono text-lg text-green-300 sm:text-xl md:text-2xl'>
              SOFTWARE CONTRACTOR
            </p>
          </ScrollFade>
          <ScrollFade>
            <p className='font-mono text-base text-green-400 opacity-80 sm:text-lg md:text-xl'>
              FULL-STACK DEVELOPMENT
            </p>
          </ScrollFade>
          <ScrollFade>
            <p className='font-mono text-sm text-green-500 opacity-60 sm:text-base md:text-lg'>
              REACT • NEXT.JS • TYPESCRIPT • NODE.JS
            </p>
          </ScrollFade>
        </div>

        {/* Matrix-style decorative elements */}
        <ScrollFade>
          <div className='mt-12 flex justify-center space-x-8'>
            <div 
              className='h-16 w-1 bg-green-400 transition-transform duration-300 ease-out' 
              style={{ transform: leftBarTransform }}
            />
            <div className='h-16 w-1 bg-green-500' />
            <div 
              className='h-16 w-1 bg-green-300 transition-transform duration-300 ease-out' 
              style={{ transform: rightBarTransform }}
            />
          </div>
        </ScrollFade>

        {/* Additional Matrix-style info */}
        <div className='mt-16 font-mono text-sm text-green-600 opacity-40'>
          <ScrollFade>
            <p>
              <TypewriterEffect text='SYSTEM STATUS: ONLINE' speed={50} />
            </p>
          </ScrollFade>
          <ScrollFade>
            <p>
              <TypewriterEffect text='CONNECTION: SECURE' speed={50} />
            </p>
          </ScrollFade>
          <ScrollFade>
            <p>
              <TypewriterEffect text='READY FOR DEPLOYMENT' speed={50} />
            </p>
          </ScrollFade>
        </div>
      </div>
    </div>
  )
}
