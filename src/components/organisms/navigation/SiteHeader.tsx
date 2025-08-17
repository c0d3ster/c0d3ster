'use client'

import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type SiteHeaderProps = {
  fadeOnScroll?: boolean
}

export const SiteHeader = ({ fadeOnScroll = true }: SiteHeaderProps) => {
  const [activeSection, setActiveSection] = useState('home')
  const [scrollY, setScrollY] = useState(0)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const pathname = usePathname()
  const setActiveSectionRef = useRef(setActiveSection)
  const setScrollYRef = useRef(setScrollY)
  const { user, isLoaded } = useUser()

  // Check if we're on the landing page (where anchor navigation works)
  const isLandingPage =
    pathname === '/' || pathname.endsWith('/en') || pathname.endsWith('/fr')

  useEffect(() => {
    // Check initial scroll position on mount
    const initialScrollY = window.scrollY
    setScrollYRef.current(initialScrollY)

    // Determine initial active section based on current scroll position
    const sections = ['home', 'portfolio', 'contact']
    const sectionElements = sections.map((id) => document.getElementById(id))

    for (let i = sections.length - 1; i >= 0; i--) {
      const element = sectionElements[i]
      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.top <= 100) {
          setActiveSectionRef.current(sections[i] || 'home')
          break
        }
      }
    }

    const handleScroll = () => {
      setScrollYRef.current(window.scrollY)

      // Determine active section based on scroll position
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = sectionElements[i]
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100) {
            setActiveSectionRef.current(sections[i] || 'home')
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
  const opacity = fadeOnScroll ? fadeProgress : 1

  return (
    <header
      className='fixed top-0 right-0 left-0 z-50 border-b border-green-400/20 bg-black/80 backdrop-blur-sm transition-opacity duration-300'
      style={{ opacity }}
    >
      <div className='container mx-auto flex items-center justify-between px-4 py-4'>
        {/* Logo */}
        <div className='flex items-center space-x-4'>
          <Link href='/'>
            <Image
              src='/assets/images/c0d3sterLogoPowerNoBackgroundCropped.png'
              alt='c0d3ster Logo'
              width={32}
              height={32}
              className='h-8 w-auto transition-opacity duration-300 hover:opacity-80 sm:h-10'
              priority
            />
          </Link>
        </div>

        {/* Navigation - centered */}
        <nav className='absolute left-1/2 flex -translate-x-1/2 items-center space-x-4 md:space-x-8'>
          {isLandingPage ? (
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
          ) : (
            <Link
              href='/'
              className='header-nav-link font-mono text-green-300 opacity-40 transition-colors hover:text-green-400'
            >
              HOME
            </Link>
          )}

          {isLandingPage ? (
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
          ) : (
            <Link
              href='/projects'
              className={`header-nav-link font-mono transition-colors hover:text-green-400 ${
                pathname.includes('/projects')
                  ? 'text-green-400'
                  : 'text-green-300 opacity-40'
              }`}
            >
              PORTFOLIO
            </Link>
          )}

          {isLandingPage ? (
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
          ) : (
            <Link
              href='/#contact'
              className='header-nav-link font-mono text-green-300 opacity-40 transition-colors hover:text-green-400'
            >
              CONTACT
            </Link>
          )}
        </nav>

        {/* Status indicator and auth controls */}
        <div className='flex items-center space-x-4'>
          {/* Status indicator dropdown */}
          <div className='relative'>
            <div
              className='flex cursor-pointer items-center space-x-2 transition-opacity hover:opacity-80'
              onMouseEnter={() => setShowStatusDropdown(true)}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  isLoaded && user
                    ? 'animate-pulse bg-green-400'
                    : 'bg-yellow-300'
                }`}
              />
              <span
                className={`header-status font-mono ${
                  isLoaded && user ? 'text-green-400' : 'text-yellow-300'
                }`}
              >
                {isLoaded && user ? 'ONLINE' : 'GUEST'}
              </span>
            </div>

            {/* Dropdown menu */}
            {showStatusDropdown && (
              <div
                className='absolute top-full right-0 z-50 mt-2 min-w-32 rounded-lg border border-green-400/20 bg-black/90 shadow-lg backdrop-blur-sm'
                onMouseEnter={() => setShowStatusDropdown(true)}
                onMouseLeave={() => setShowStatusDropdown(false)}
              >
                <div className='py-2'>
                  {isLoaded && user ? (
                    <>
                      <Link
                        href='/dashboard'
                        className='block px-4 py-2 text-right font-mono text-sm text-green-300 transition-colors hover:bg-green-400/10 hover:text-green-400'
                      >
                        Dashboard
                      </Link>
                      <SignOutButton>
                        <button
                          type='button'
                          className='block w-full px-4 py-2 text-right font-mono text-sm text-yellow-300 transition-colors hover:bg-yellow-300/20 hover:text-yellow-400'
                        >
                          Sign Out
                        </button>
                      </SignOutButton>
                    </>
                  ) : (
                    <SignInButton mode='modal'>
                      <button
                        type='button'
                        className='block w-full px-4 py-2 text-right font-mono text-sm text-green-300 transition-colors hover:bg-green-400/10 hover:text-green-400'
                      >
                        Sign In
                      </button>
                    </SignInButton>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
