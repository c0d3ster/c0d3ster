'use client'

import { useEffect, useState } from 'react'
import {
  ScrollFade,
  SectionWrapper,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading, AnimatedParagraph } from '@/components/molecules'

type HeroSectionProps = {
  title?: string
  subtitle?: string
  description?: string
  techStack?: string
}

export const HeroSection = ({
  title = 'c0d3ster',
  subtitle = 'SOFTWARE CONTRACTOR',
  description = 'FULL-STACK DEVELOPMENT',
  techStack = 'REACT • NEXT.JS • TYPESCRIPT • NODE.JS',
}: HeroSectionProps) => {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Matrix-style decorative elements animation
  const maxExpansion = 50
  const expansionProgress = Math.min(scrollY / 500, 1)
  const leftBarTransform = `translateX(-${expansionProgress * maxExpansion}px)`
  const rightBarTransform = `translateX(${expansionProgress * maxExpansion}px)`

  return (
    <SectionWrapper
      id='home'
      className='relative flex min-h-screen items-center justify-center px-4 py-4 pt-16'
    >
      {/* Main content */}
      <div className='relative z-10 text-center'>
        {/* Main text */}
        <AnimatedHeading
          text={title}
          level='h1'
          variant='hero'
          withTypewriter={true}
          typewriterSpeed={200}
          keepCursor={true}
          className='mb-8'
        />

        {/* Subtitle */}
        <div className='mt-8 space-y-4'>
          <AnimatedParagraph variant='large'>{subtitle}</AnimatedParagraph>
          <AnimatedParagraph variant='default'>{description}</AnimatedParagraph>
          <AnimatedParagraph variant='small'>{techStack}</AnimatedParagraph>
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
    </SectionWrapper>
  )
}
