/* eslint-disable @next/next/no-img-element */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BRAND_NAME } from '@/constants'

import type { NavItem } from './SiteHeader'

import { SiteHeader } from './SiteHeader'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({
    user: null,
    isLoaded: true,
  })),
  SignInButton: ({ children }: any) => <div>{children}</div>,
  SignOutButton: ({ children }: any) => <div>{children}</div>,
}))

// Mock window properties to prevent hanging
Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

// Sample menu items for testing
const sampleMenuItems: NavItem[] = [
  { label: 'HOME', href: '/' },
  { label: 'PORTFOLIO', href: '/projects' },
  { label: 'CONTACT', href: '/#contact' },
]

const dashboardMenuItems: NavItem[] = [
  { label: 'DASHBOARD', href: '/dashboard' },
  { label: 'USER PROFILE', href: '/dashboard/user-profile' },
]

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders header element', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const header = screen.getByRole('banner')

    expect(header).toBeInTheDocument()
  })

  it('renders logo image', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const logo = screen.getByAltText(`${BRAND_NAME} Logo`)

    expect(logo).toBeInTheDocument()
  })

  it('renders navigation menu items', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.getByText('PORTFOLIO')).toBeInTheDocument()
    expect(screen.getByText('CONTACT')).toBeInTheDocument()
  })

  it('renders public site status indicator when not dashboard', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByText('GUEST')).toBeInTheDocument()
  })

  it('renders dashboard status indicator when isDashboard is true', () => {
    render(<SiteHeader menuItems={dashboardMenuItems} isDashboard />)

    expect(screen.getByText('ONLINE')).toBeInTheDocument()
  })

  it('applies fade on scroll for root route', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const header = screen.getByRole('banner')

    expect(header).toHaveAttribute('style')
    expect(header.getAttribute('style')).toContain('opacity')
  })

  it('sets up scroll event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<SiteHeader menuItems={sampleMenuItems} />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('renders correct href attributes for menu items', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const homeLink = screen.getByText('HOME').closest('a')
    const portfolioLink = screen.getByText('PORTFOLIO').closest('a')
    const contactLink = screen.getByText('CONTACT').closest('a')

    expect(homeLink).toHaveAttribute('href', '/')
    expect(portfolioLink).toHaveAttribute('href', '/#portfolio') // Custom route logic for root route
    expect(contactLink).toHaveAttribute('href', '/#contact')
  })

  it('handles dashboard menu items correctly', () => {
    render(<SiteHeader menuItems={dashboardMenuItems} isDashboard />)

    expect(screen.getByText('DASHBOARD')).toBeInTheDocument()
    expect(screen.getByText('USER PROFILE')).toBeInTheDocument()

    const dashboardLink = screen.getByText('DASHBOARD').closest('a')
    const profileLink = screen.getByText('USER PROFILE').closest('a')

    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    expect(profileLink).toHaveAttribute('href', '/dashboard/user-profile')
  })

  it('applies correct styling classes to menu items', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const homeLink = screen.getByText('HOME').closest('a')

    expect(homeLink).toHaveClass(
      'header-nav-link',
      'font-mono',
      'transition-colors'
    )
  })

  it('renders without errors when no menu items provided', () => {
    render(<SiteHeader menuItems={[]} />)

    const header = screen.getByRole('banner')

    expect(header).toBeInTheDocument()
  })

  it('sets up hash change event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function)
    )
  })

  it('cleans up hash change event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<SiteHeader menuItems={sampleMenuItems} />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function)
    )
  })
})
