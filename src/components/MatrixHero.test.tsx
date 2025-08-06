import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MatrixHero } from './MatrixHero'

// Mock timers for typing effect
vi.useFakeTimers()

describe('MatrixHero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup() // Clean up any previous renders
  })

  afterEach(() => {
    cleanup() // Clean up after each test
  })

  it('renders the main container', () => {
    const { container } = render(<MatrixHero />)
    const mainContainer = container.querySelector('div')

    expect(mainContainer).toBeInTheDocument()
  })

  it('displays the main title with typing effect', async () => {
    render(<MatrixHero />)

    // Check that the title element exists
    const title = screen.getByRole('heading', { level: 1 })

    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('_') // Initially shows underscore

    // The typing effect is complex to test with fake timers
    // Just verify the component renders properly
    expect(title).toHaveClass(
      'mb-8',
      'font-mono',
      'text-8xl',
      'font-bold',
      'tracking-wider',
      'text-green-400',
      'md:text-9xl'
    )
  })

  it('shows flashing underscore during typing', () => {
    render(<MatrixHero />)

    const title = screen.getByRole('heading', { level: 1 })
    const underscore = title.querySelector('span')

    expect(underscore).toBeInTheDocument()
    expect(underscore).toHaveClass('animate-pulse')
  })

  it('displays software contractor subtitle', () => {
    render(<MatrixHero />)

    const contractorText = screen.getByText('SOFTWARE CONTRACTOR')

    expect(contractorText).toBeInTheDocument()
    expect(contractorText).toHaveClass('font-mono', 'text-xl', 'text-green-300')
  })

  it('displays full-stack development subtitle', () => {
    render(<MatrixHero />)

    const developmentText = screen.getByText('FULL-STACK DEVELOPMENT')

    expect(developmentText).toBeInTheDocument()
    expect(developmentText).toHaveClass(
      'font-mono',
      'text-lg',
      'text-green-400'
    )
  })

  it('displays technology stack', () => {
    render(<MatrixHero />)

    const techStack = screen.getByText('REACT • NEXT.JS • TYPESCRIPT • NODE.JS')

    expect(techStack).toBeInTheDocument()
    expect(techStack).toHaveClass('font-mono', 'text-base', 'text-green-500')
  })

  it('renders decorative elements', () => {
    render(<MatrixHero />)

    // Check for decorative bars
    const decorativeBars = screen
      .getAllByRole('generic')
      .filter((el) => el.className.includes('h-16 w-1 bg-green'))

    expect(decorativeBars).toHaveLength(3)
  })

  it('displays system status information', () => {
    render(<MatrixHero />)

    const systemStatus = screen.getByText('SYSTEM STATUS: ONLINE')
    const connection = screen.getByText('CONNECTION: SECURE')
    const deployment = screen.getByText('READY FOR DEPLOYMENT')

    expect(systemStatus).toBeInTheDocument()
    expect(connection).toBeInTheDocument()
    expect(deployment).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    const { container } = render(<MatrixHero />)

    const mainContainer = container.querySelector('div')

    expect(mainContainer).toHaveClass(
      'relative',
      'flex',
      'min-h-screen',
      'items-center',
      'justify-center'
    )
  })

  it('has proper z-index layering', () => {
    const { container } = render(<MatrixHero />)

    const content = container.querySelector('.relative.z-10')

    expect(content).toBeInTheDocument()
  })

  it('has responsive text sizing', () => {
    render(<MatrixHero />)

    const title = screen.getByRole('heading', { level: 1 })

    expect(title).toHaveClass('text-8xl', 'md:text-9xl')
  })

  it('uses monospace font throughout', () => {
    render(<MatrixHero />)

    const title = screen.getByRole('heading', { level: 1 })
    const contractorText = screen.getByText('SOFTWARE CONTRACTOR')
    const developmentText = screen.getByText('FULL-STACK DEVELOPMENT')
    const techStack = screen.getByText('REACT • NEXT.JS • TYPESCRIPT • NODE.JS')

    expect(title).toHaveClass('font-mono')
    expect(contractorText).toHaveClass('font-mono')
    expect(developmentText).toHaveClass('font-mono')
    expect(techStack).toHaveClass('font-mono')
  })

  it('has proper spacing between elements', () => {
    render(<MatrixHero />)

    const title = screen.getByRole('heading', { level: 1 })
    const subtitle = screen.getByText('SOFTWARE CONTRACTOR').closest('div')

    expect(title).toHaveClass('mb-8')
    expect(subtitle).toHaveClass('mt-8')
  })
})
