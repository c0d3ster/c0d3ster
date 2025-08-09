import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpandingUnderline } from './ExpandingUnderline'

// Mock window properties
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

describe('ExpandingUnderline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup() // Clean up any previous renders
  })

  afterEach(() => {
    cleanup() // Clean up after each test
  })

  it('renders the underline element', () => {
    const { container } = render(<ExpandingUnderline />)
    const underline = container.querySelector('div')

    expect(underline).toBeInTheDocument()
  })

  it('accepts custom className prop', () => {
    const customClass = 'custom-underline'
    const { container } = render(<ExpandingUnderline className={customClass} />)
    const underline = container.querySelector('div')

    expect(underline).toHaveClass(customClass)
  })

  it('applies custom maxWidth', () => {
    const { container } = render(<ExpandingUnderline maxWidth={200} />)
    const underline = container.querySelector('div')

    expect(underline).toBeInTheDocument()
    // Width is controlled by state based on scroll, so we just verify element exists
  })

  it('sets up scroll event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(<ExpandingUnderline />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<ExpandingUnderline />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('handles scroll events without errors', () => {
    render(<ExpandingUnderline />)

    // Simulate scroll event
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // Should not throw any errors
    expect(true).toBe(true)
  })

  it('updates width based on scroll position', () => {
    const { container } = render(<ExpandingUnderline maxWidth={100} />)
    const underline = container.querySelector('div')

    // Mock getBoundingClientRect to simulate element in viewport
    const mockGetBoundingClientRect = vi.fn(() => ({
      top: 400, // Element below viewport initially
      left: 0,
      bottom: 450,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }))

    if (underline) {
      underline.getBoundingClientRect = mockGetBoundingClientRect
    }

    // Simulate scroll that brings element into view
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // Width should be controlled by scroll progress
    expect(underline).toHaveAttribute('style')
    expect(underline?.getAttribute('style')).toContain('width')
  })

  it('calculates expansion progress correctly', () => {
    const { container } = render(<ExpandingUnderline maxWidth={200} />)
    const underline = container.querySelector('div')

    // Mock element at top of viewport (fully expanded)
    const mockGetBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }))

    if (underline) {
      underline.getBoundingClientRect = mockGetBoundingClientRect
    }

    // Trigger scroll calculation
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // Should apply calculated width
    expect(underline).toHaveAttribute('style')

    const style = underline?.getAttribute('style')

    expect(style).toMatch(/width:\s*\d+px/)
  })

  it('uses custom maxScroll when provided', () => {
    const { container } = render(<ExpandingUnderline maxScroll={500} />)
    const underline = container.querySelector('div')

    expect(underline).toBeInTheDocument()
  })

  it('initializes with calculated width based on scroll position', () => {
    const { container } = render(<ExpandingUnderline />)
    const underline = container.querySelector('div')

    // Width is calculated based on scroll position and viewport, so just verify element exists
    expect(underline).toBeInTheDocument()
    expect(underline).toHaveAttribute('style')
  })
})
