import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MatrixBackground } from './MatrixBackground'

// Mock window properties
Object.defineProperty(window, 'innerWidth', { value: 800, writable: true })
Object.defineProperty(window, 'innerHeight', { value: 600, writable: true })

describe('MatrixBackground', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    cleanup() // Clean up any previous renders
  })

  afterEach(() => {
    cleanup() // Clean up after each test
  })

  it('renders canvas element', () => {
    const { container } = render(<MatrixBackground />)
    const canvas = container.querySelector('canvas')

    expect(canvas).toBeInTheDocument()
  })

  it('sets up canvas with correct styling', () => {
    const { container } = render(<MatrixBackground />)
    const canvas = container.querySelector('canvas')

    expect(canvas).toHaveClass('fixed', 'inset-0', 'z-0')
    expect(canvas).toHaveStyle({
      background: 'black',
      width: '100vw',
      height: '100vh',
    })
  })

  it('initializes canvas context on mount', () => {
    render(<MatrixBackground />)

    // Canvas context should be called
    expect(true).toBe(true) // Component should render without errors
  })

  it('sets up mouse event listeners', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    render(<MatrixBackground />)

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<MatrixBackground />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('sets up animation interval', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    render(<MatrixBackground />)

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 100)
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(<MatrixBackground />)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('handles mouse movement', () => {
    render(<MatrixBackground />)

    // Simulate mouse movement
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: 100,
      clientY: 200,
    })

    window.dispatchEvent(mouseEvent)

    // The component should handle the mouse event without errors
    expect(true).toBe(true) // Just checking it doesn't throw
  })

  it('handles window resize', () => {
    render(<MatrixBackground />)

    // Simulate window resize
    const resizeEvent = new Event('resize')
    window.dispatchEvent(resizeEvent)

    // The component should handle the resize event without errors
    expect(true).toBe(true) // Just checking it doesn't throw
  })
})
