'use client'

import { useEffect, useState } from 'react'

export const AnimatedHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 100)

      // Determine active section based on scroll position
      const sections = ['home', 'portfolio', 'contact']
      const sectionElements = sections.map(id => document.getElementById(id))
      
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

  if (!isScrolled) {
    return null
  }

  return (
    <header className='fixed top-0 right-0 left-0 z-50 border-b border-green-400/20 bg-black/80 backdrop-blur-sm'>
      <div className='container mx-auto flex items-center justify-between px-4 py-4'>
        {/* Logo */}
        <div className='flex items-center space-x-4'>
          <h1 className='font-mono text-2xl font-bold text-green-400'>
            c0d3ster
            <span className='animate-pulse'>_</span>
          </h1>
        </div>

        {/* Navigation - centered */}
        <nav className='absolute left-1/2 hidden -translate-x-1/2 items-center space-x-8 md:flex'>
          <a
            href='#home'
            className={`font-mono text-sm transition-colors hover:text-green-400 ${
              activeSection === 'home' ? 'text-green-400' : 'text-green-300 opacity-50'
            }`}
          >
            HOME
          </a>
          <a
            href='#portfolio'
            className={`font-mono text-sm transition-colors hover:text-green-400 ${
              activeSection === 'portfolio' ? 'text-green-400' : 'text-green-300 opacity-50'
            }`}
          >
            PORTFOLIO
          </a>
          <a
            href='#contact'
            className={`font-mono text-sm transition-colors hover:text-green-400 ${
              activeSection === 'contact' ? 'text-green-400' : 'text-green-300 opacity-50'
            }`}
          >
            CONTACT
          </a>
        </nav>

        {/* Status indicator */}
        <div className='flex items-center space-x-2'>
          <div className='h-2 w-2 animate-pulse rounded-full bg-green-400' />
          <span className='font-mono text-xs text-green-400'>ONLINE</span>
        </div>
      </div>
    </header>
  )
}
