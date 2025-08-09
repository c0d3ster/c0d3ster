'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export const SiteHeader = () => {
  const [activeSection, setActiveSection] = useState('home')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)

      // Determine active section based on scroll position
      const sections = ['home', 'portfolio', 'contact']
      const sectionElements = sections.map((id) => document.getElementById(id))

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = sectionElements[i]
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100) {
            setActiveSection(sections[i] || 'home')
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Header animation: fade in when scrolling down, fade out when at top
  const fadeStart = 50 // Start fading in at 50px scroll
  const fadeEnd = 225 // Fully visible at 150px scroll
  const fadeProgress = Math.max(
    0,
    Math.min(1, (scrollY - fadeStart) / (fadeEnd - fadeStart))
  )
  const opacity = fadeProgress

  return (
    <header
      className='fixed top-0 right-0 left-0 z-50 border-b border-green-400/20 bg-black/80 backdrop-blur-sm transition-opacity duration-300'
      style={{ opacity }}
    >
      <div className='container mx-auto flex items-center justify-between px-4 py-4'>
        {/* Logo */}
        <div className='flex items-center space-x-4'>
          <Image
            src='/assets/images/c0d3sterLogoPowerNoBackgroundCropped.png'
            alt='c0d3ster Logo'
            width={32}
            height={32}
            className='h-8 w-auto sm:h-10'
            priority
          />
        </div>

        {/* Navigation - centered */}
        <nav className='absolute left-1/2 flex -translate-x-1/2 items-center space-x-4 md:space-x-8'>
          <a
            href='#home'
            className={`header-nav-link font-mono transition-colors hover:text-green-400 ${
              activeSection === 'home'
                ? 'text-green-400'
                : 'text-green-300 opacity-40'
            }`}
          >
            HOME
          </a>
          <a
            href='#portfolio'
            className={`header-nav-link font-mono transition-colors hover:text-green-400 ${
              activeSection === 'portfolio'
                ? 'text-green-400'
                : 'text-green-300 opacity-40'
            }`}
          >
            PORTFOLIO
          </a>
          <a
            href='#contact'
            className={`header-nav-link font-mono transition-colors hover:text-green-400 ${
              activeSection === 'contact'
                ? 'text-green-400'
                : 'text-green-300 opacity-40'
            }`}
          >
            CONTACT
          </a>
        </nav>

        {/* Status indicator */}
        <div className='flex items-center space-x-2'>
          <div className='h-2 w-2 animate-pulse rounded-full bg-green-400' />
          <span className='header-status font-mono text-green-400'>ONLINE</span>
        </div>
      </div>
    </header>
  )
}
