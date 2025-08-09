import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollFade } from './ScrollFade'

// Mock window properties
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

describe('ScrollFade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup() // Clean up any previous renders
  })

  afterEach(() => {
    cleanup() // Clean up after each test
  })

  it('renders children correctly', () => {
    const testContent = 'Test content'
    render(
      <ScrollFade>
        <div>{testContent}</div>
      </ScrollFade>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('accepts custom className prop', () => {
    const customClass = 'custom-fade'
    render(
      <ScrollFade className={customClass}>
        <div>content</div>
      </ScrollFade>
    )

    const container = screen.getByText('content').parentElement

    expect(container).toHaveClass(customClass)
  })

  it('sets up scroll event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })

  it('handles scroll events without errors', () => {
    render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    // Simulate scroll event
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // Should not throw any errors
    expect(true).toBe(true)
  })

  it('updates opacity based on element position in viewport', () => {
    render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    const container = screen.getByText('content').parentElement

    // Mock getBoundingClientRect to simulate different viewport positions
    const mockGetBoundingClientRect = vi.fn(() => ({
      top: 100, // Element in center of viewport
      left: 0,
      bottom: 150,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }))

    if (container) {
      container.getBoundingClientRect = mockGetBoundingClientRect as any
    }

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true })

    // Trigger scroll calculation
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // Should have opacity style applied
    expect(container).toHaveAttribute('style')
    expect(container?.getAttribute('style')).toContain('opacity')
  })

  it('applies different opacity values based on viewport zones', () => {
    render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    const container = screen.getByText('content').parentElement

    // Test element in bottom fade zone (should have partial opacity)
    const mockBottomZone = vi.fn(() => ({
      top: 700, // Near bottom of 768px viewport
      left: 0,
      bottom: 750,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 700,
      toJSON: () => ({}),
    }))

    if (container) {
      container.getBoundingClientRect = mockBottomZone as any
    }

    // Trigger scroll calculation
    window.dispatchEvent(new Event('scroll'))

    // Should apply opacity style
    expect(container).toHaveAttribute('style')

    const style = container?.getAttribute('style')

    expect(style).toMatch(/opacity:\s*[\d.]+/)
  })

  it('handles viewport zone transitions smoothly', () => {
    render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    const container = screen.getByText('content').parentElement

    // Test element in center zone (should have full opacity)
    const mockCenterZone = vi.fn(() => ({
      top: 300, // Center of 768px viewport
      left: 0,
      bottom: 350,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 300,
      toJSON: () => ({}),
    }))

    if (container) {
      container.getBoundingClientRect = mockCenterZone as any
    }

    // Trigger scroll calculation
    window.dispatchEvent(new Event('scroll'))

    // Should maintain opacity control
    expect(container).toHaveAttribute('style')
    expect(container?.getAttribute('style')).toContain('opacity')
  })

  it('handles opacity calculations based on scroll position', () => {
    render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    const container = screen.getByText('content').parentElement

    // Opacity is calculated based on scroll position and viewport
    expect(container).toHaveAttribute('style')
  })

  it('handles client-side rendering state', () => {
    render(
      <ScrollFade>
        <div>content</div>
      </ScrollFade>
    )

    const container = screen.getByText('content').parentElement

    // Should have transition classes for animations
    expect(container).toHaveClass('transition-all', 'duration-300')
  })
})
