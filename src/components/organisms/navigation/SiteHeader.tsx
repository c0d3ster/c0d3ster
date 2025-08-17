'use client'

import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export type NavItem = { label: string; href: string }

type SiteHeaderProps = {
  menuItems: NavItem[]
  isDashboard?: boolean
}

export const SiteHeader = ({
  menuItems,
  isDashboard = false,
}: SiteHeaderProps) => {
  const [scrollY, setScrollY] = useState(0)
  const [activeItem, setActiveItem] = useState<string>('home')
  const setScrollYRef = useRef(setScrollY)
  const setActiveItemRef = useRef(setActiveItem)
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  // Determine if header should fade based on route
  const shouldFade =
    pathname === '/' || pathname.endsWith('/en') || pathname.endsWith('/fr')

  useEffect(() => {
    // Check initial scroll position on mount
    const initialScrollY = window.scrollY
    setScrollYRef.current(initialScrollY)

    const handleScroll = () => {
      setScrollYRef.current(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle route-based highlighting
  useEffect(() => {
    // Find the current item based on pathname
    const currentItem = menuItems.find((item) => {
      // For dashboard routes, use more specific matching
      if (isDashboard) {
        const matchingItems = menuItems.filter((menuItem) =>
          pathname.startsWith(menuItem.href)
        )
        if (matchingItems.length > 0) {
          const mostSpecific = matchingItems.reduce((a, b) =>
            a.href.length > b.href.length ? a : b
          )
          return item.href === mostSpecific.href
        }
      }

      // For public routes, check exact match first
      if (pathname === item.href) return true

      // For public routes, be more specific about matching
      if (pathname !== '/' && item.href === '/') {
        return false
      }

      // Only match if the pathname starts with the item href
      return pathname.startsWith(item.href)
    })

    if (currentItem) {
      setActiveItemRef.current(currentItem.label.toLowerCase())
    }
  }, [pathname, menuItems, isDashboard])

  // Scroll-based highlighting for sections
  useEffect(() => {
    const onScroll = () => {
      // Only process scroll highlighting when on root route
      const isRootRoute =
        pathname === '/' || pathname.endsWith('/en') || pathname.endsWith('/fr')
      if (!isRootRoute) return

      // Check each section for scroll-based highlighting
      const sections = [
        { label: 'home', id: 'home' },
        { label: 'portfolio', id: 'projects' },
        { label: 'contact', id: 'contact' },
      ]

      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (!element) continue

        const rect = element.getBoundingClientRect()
        // Check if section is in view (top of section is above viewport center, bottom is below)
        if (
          rect.top <= window.innerHeight / 2 &&
          rect.bottom >= window.innerHeight / 2
        ) {
          setActiveItemRef.current(section.label)
          break
        }
      }
    }

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true })

    // Also check on mount
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  // Handle hash changes from navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash) {
        // Map hash to label
        const hashToLabel: Record<string, string> = {
          '#projects': 'portfolio',
          '#contact': 'contact',
        }

        const label = hashToLabel[hash]
        if (label) {
          setActiveItemRef.current(label)
        }
      }
    }

    // Check initial hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Header animation: fade in when scrolling down, fade out when at top
  const fadeStart = 50 // Start fading in at 50px scroll
  const fadeEnd = 225 // Fully visible at 150px scroll
  const fadeProgress = Math.max(
    0,
    Math.min(1, (scrollY - fadeStart) / (fadeEnd - fadeStart))
  )
  const opacity = shouldFade ? fadeProgress : 1

  // Generate the actual navigation items with custom route logic
  const renderMenuItems = () => {
    return menuItems.map((item) => {
      let href = item.href
      const isActive = activeItem === item.label.toLowerCase()

      // Custom route logic for PORTFOLIO
      if (item.label === 'PORTFOLIO') {
        const isRootRoute =
          pathname === '/' ||
          pathname.endsWith('/en') ||
          pathname.endsWith('/fr')
        href = isRootRoute ? '/#projects' : '/projects'
      }

      return (
        <Link
          key={item.label}
          href={href}
          className={`header-nav-link font-mono transition-colors hover:text-green-400 ${
            isActive ? 'text-green-400' : 'text-green-300 opacity-40'
          }`}
        >
          {item.label}
        </Link>
      )
    })
  }

  // Render the right section based on context
  const renderRightSection = () => {
    if (isDashboard) {
      // Dashboard right section (ONLINE status with Sign Out)
      return (
        <div className='group relative'>
          <div className='flex cursor-pointer items-center space-x-2 transition-opacity hover:opacity-80'>
            <div className='h-2 w-2 animate-pulse rounded-full bg-green-400' />
            <span className='header-status font-mono text-green-400'>
              ONLINE
            </span>
          </div>

          {/* Dropdown menu */}
          <div className='absolute top-full right-0 z-50 mt-2 min-w-32 rounded-lg border border-green-400/20 bg-black/90 opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100'>
            <div className='py-2'>
              <SignOutButton>
                <button
                  type='button'
                  className='block w-full px-4 py-2 text-right font-mono text-sm text-yellow-300 transition-colors hover:bg-yellow-300/20 hover:text-yellow-400'
                >
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      )
    } else {
      // Public site right section (GUEST/ONLINE status with dropdown)
      return (
        <div className='group relative'>
          <div className='flex cursor-pointer items-center space-x-2 transition-opacity hover:opacity-80'>
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
          <div className='absolute top-full right-0 z-50 mt-2 min-w-32 rounded-lg border border-green-400/20 bg-black/90 opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100'>
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
        </div>
      )
    }
  }

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
          {renderMenuItems()}
        </nav>

        {/* Right Section - Status indicator and auth */}
        <div className='flex items-center space-x-4'>
          {renderRightSection()}
        </div>
      </div>
    </header>
  )
}
