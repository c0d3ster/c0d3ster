'use client'

import { useEffect, useState } from 'react'

export const AnimatedHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 100)
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

        {/* Navigation */}
        <nav className='hidden items-center space-x-8 md:flex'>
          <a
            href='#home'
            className='font-mono text-sm text-green-300 transition-colors hover:text-green-400'
          >
            HOME
          </a>
          <a
            href='#portfolio'
            className='font-mono text-sm text-green-300 transition-colors hover:text-green-400'
          >
            PORTFOLIO
          </a>
          <a
            href='#contact'
            className='font-mono text-sm text-green-300 transition-colors hover:text-green-400'
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
