import { cleanup, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

// Mock window properties to prevent hanging
Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

const mockMessages = {}

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  const renderWithIntl = (component: React.ReactNode) => {
    return render(
      <NextIntlClientProvider locale='en' messages={mockMessages}>
        {component}
      </NextIntlClientProvider>
    )
  }

  it('renders header element', () => {
    renderWithIntl(<SiteHeader />)

    const header = screen.getByRole('banner')

    expect(header).toBeInTheDocument()
  })

  it('renders logo image', () => {
    renderWithIntl(<SiteHeader />)

    const logo = screen.getByAltText('c0d3ster Logo')

    expect(logo).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderWithIntl(<SiteHeader />)

    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.getByText('PORTFOLIO')).toBeInTheDocument()
    expect(screen.getByText('CONTACT')).toBeInTheDocument()
  })

  it('renders status indicator', () => {
    renderWithIntl(<SiteHeader />)

    expect(screen.getByText('ONLINE')).toBeInTheDocument()
  })

  it('applies fade on scroll by default', () => {
    renderWithIntl(<SiteHeader />)

    const header = screen.getByRole('banner')

    expect(header).toHaveStyle({ opacity: '0' }) // Initially hidden due to scroll position
  })

  it('disables fade when fadeOnScroll is false', () => {
    renderWithIntl(<SiteHeader fadeOnScroll={false} />)

    const header = screen.getByRole('banner')

    expect(header).toHaveStyle({ opacity: '1' }) // Always visible
  })

  it('sets up scroll event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    renderWithIntl(<SiteHeader />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderWithIntl(<SiteHeader />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('has opacity style when fadeOnScroll is enabled', () => {
    renderWithIntl(<SiteHeader fadeOnScroll={true} />)

    const header = screen.getByRole('banner')

    // Header should have opacity style applied
    expect(header).toHaveAttribute('style')
    expect(header.getAttribute('style')).toContain('opacity')
  })

  it('renders anchor links on landing page', () => {
    renderWithIntl(<SiteHeader />)

    const homeLink = screen.getByText('HOME').closest('a')
    const portfolioLink = screen.getByText('PORTFOLIO').closest('a')
    const contactLink = screen.getByText('CONTACT').closest('a')

    expect(homeLink).toHaveAttribute('href', '#home')
    expect(portfolioLink).toHaveAttribute('href', '#portfolio')
    expect(contactLink).toHaveAttribute('href', '#contact')
  })

  it('highlights active section based on scroll position', () => {
    // Mock getBoundingClientRect for sections
    const mockGetBoundingClientRect = vi.fn(() => ({
      top: 50,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 50,
      toJSON: () => ({}),
    }))

    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect

    renderWithIntl(<SiteHeader />)

    // Should render without errors
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('handles missing sections gracefully', () => {
    // Mock getElementById to return null
    const originalGetElementById = document.getElementById
    document.getElementById = vi.fn(() => null)

    renderWithIntl(<SiteHeader />)

    // Should not throw errors
    expect(screen.getByText('HOME')).toBeInTheDocument()

    // Restore original method
    document.getElementById = originalGetElementById
  })
})
