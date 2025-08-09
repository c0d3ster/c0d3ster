import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TypewriterEffect } from './TypewriterEffect'

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockUnobserve = vi.fn()

class MockIntersectionObserver {
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = mockUnobserve
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

describe('TypewriterEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockObserve.mockClear()
    mockDisconnect.mockClear()
    mockUnobserve.mockClear()
    vi.useFakeTimers()
    cleanup() // Clean up any previous renders
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup() // Clean up after each test
  })

  it('renders the span element', () => {
    const { container } = render(<TypewriterEffect text='Hello World' />)
    const span = container.querySelector('span')

    expect(span).toBeInTheDocument()
  })

  it('initially shows cursor when showCursor is true', () => {
    render(<TypewriterEffect text='Hello' showCursor={true} />)

    const cursor = screen.getByText('_')

    expect(cursor).toBeInTheDocument()
    expect(cursor).toHaveClass('animate-pulse')
  })

  it('hides cursor when showCursor is false', () => {
    render(<TypewriterEffect text='Hello' showCursor={false} />)

    const cursor = screen.queryByText('_')

    expect(cursor).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-typewriter'
    const { container } = render(
      <TypewriterEffect text='Hello' className={customClass} />
    )
    const span = container.querySelector('span')

    expect(span).toHaveClass(customClass)
  })

  it('sets up IntersectionObserver', () => {
    render(<TypewriterEffect text='Hello World' />)

    expect(mockObserve).toHaveBeenCalled()
  })

  it('cleans up IntersectionObserver on unmount', () => {
    const { unmount } = render(<TypewriterEffect text='Hello World' />)

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('handles custom speed prop', () => {
    render(<TypewriterEffect text='Hello' speed={50} />)

    // Component should render without errors
    expect(screen.getByText('_')).toBeInTheDocument()
  })

  it('keeps cursor when keepCursor is true', () => {
    render(<TypewriterEffect text='Hi' keepCursor={true} />)

    const cursor = screen.getByText('_')

    expect(cursor).toBeInTheDocument()
  })

  it('starts with empty display text', () => {
    render(<TypewriterEffect text='Hello World' />)

    // Initially should only show cursor
    const container = screen.getByText('_').parentElement

    expect(container?.textContent).toBe('_')
  })

  it('handles empty text prop', () => {
    render(<TypewriterEffect text='' />)

    const cursor = screen.getByText('_')

    expect(cursor).toBeInTheDocument()
  })

  it('handles very long text', () => {
    const longText =
      'This is a very long text that should be handled properly by the typewriter effect component'
    render(<TypewriterEffect text={longText} />)

    expect(screen.getByText('_')).toBeInTheDocument()
  })
})
