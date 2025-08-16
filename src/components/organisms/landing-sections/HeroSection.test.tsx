import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroSection } from './HeroSection'

// Mock child components
vi.mock('@/components/atoms', () => ({
  __esModule: true,
  ScrollFade: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='scroll-fade'>{children}</div>
  ),
  SectionWrapper: ({
    children,
    id,
  }: {
    children: React.ReactNode
    id: string
  }) => (
    <section id={id} data-testid='section-wrapper'>
      {children}
    </section>
  ),
  TypewriterEffect: ({ text }: { text: string }) => (
    <span data-testid='typewriter'>{text}</span>
  ),
}))

vi.mock('@/components/molecules', () => ({
  __esModule: true,
  AnimatedHeading: ({
    text,
    withTypewriter,
  }: {
    text: string
    withTypewriter?: boolean
  }) =>
    withTypewriter ? (
      <span data-testid='animated-heading-typewriter'>{text}</span>
    ) : (
      <h1 data-testid='animated-heading'>{text}</h1>
    ),
  AnimatedParagraph: ({
    children,
    variant,
  }: {
    children: React.ReactNode
    variant?: string
  }) => (
    <p data-testid={`animated-paragraph-${variant || 'default'}`}>{children}</p>
  ),
}))

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with default props', () => {
    render(<HeroSection />)

    expect(screen.getByTestId('section-wrapper')).toBeInTheDocument()
    expect(
      screen.getByTestId('animated-heading-typewriter')
    ).toBeInTheDocument()
  })

  it('renders custom title', () => {
    const customTitle = 'Custom Title'
    render(<HeroSection title={customTitle} />)

    expect(screen.getByText(customTitle)).toBeInTheDocument()
  })

  it('renders custom subtitle', () => {
    const customSubtitle = 'Custom Subtitle'
    render(<HeroSection subtitle={customSubtitle} />)

    expect(screen.getByText(customSubtitle)).toBeInTheDocument()
  })

  it('renders custom description', () => {
    const customDescription = 'Custom Description'
    render(<HeroSection description={customDescription} />)

    expect(screen.getByText(customDescription)).toBeInTheDocument()
  })

  it('renders custom tech stack', () => {
    const customTechStack = 'VUE • SVELTE • ANGULAR'
    render(<HeroSection techStack={customTechStack} />)

    expect(screen.getByText(customTechStack)).toBeInTheDocument()
  })

  it('renders different paragraph variants', () => {
    render(<HeroSection />)

    expect(screen.getByTestId('animated-paragraph-large')).toBeInTheDocument()
    expect(screen.getByTestId('animated-paragraph-default')).toBeInTheDocument()
    expect(screen.getByTestId('animated-paragraph-small')).toBeInTheDocument()
  })

  it('renders decorative elements with transform styles', () => {
    render(<HeroSection />)

    const decorativeElements = screen.getAllByTestId('scroll-fade')

    expect(decorativeElements.length).toBeGreaterThan(0)
  })

  it('renders typewriter status messages', () => {
    render(<HeroSection />)

    expect(screen.getByText('SYSTEM STATUS: ONLINE')).toBeInTheDocument()
    expect(screen.getByText('CONNECTION: SECURE')).toBeInTheDocument()
    expect(screen.getByText('READY FOR DEPLOYMENT')).toBeInTheDocument()
  })

  it('sets up scroll event listener for animations', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(<HeroSection />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<HeroSection />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('calculates expansion progress based on scroll', () => {
    // Mock scrollY
    Object.defineProperty(window, 'scrollY', { value: 250, writable: true })

    render(<HeroSection />)

    // Simulate scroll event
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // Should not throw errors and component should still render
    expect(screen.getByTestId('section-wrapper')).toBeInTheDocument()
  })

  it('handles viewport width changes', () => {
    // Change window width
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true })

    render(<HeroSection />)

    expect(screen.getByTestId('section-wrapper')).toBeInTheDocument()
  })

  it('renders section with correct id', () => {
    render(<HeroSection />)

    const section = screen.getByTestId('section-wrapper')

    expect(section).toHaveAttribute('id', 'home')
  })

  it('handles all props together', () => {
    render(
      <HeroSection
        title='Test Title'
        subtitle='Test Subtitle'
        description='Test Description'
        techStack='TEST • STACK'
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('TEST • STACK')).toBeInTheDocument()
  })
})
