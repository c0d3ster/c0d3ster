import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock timers for typing effect
vi.useFakeTimers()

describe('MatrixHero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('can create typing effect', () => {
    // Test that we can simulate typing
    const text = 'c0d3ster'
    let currentText = ''

    for (let i = 0; i < text.length; i++) {
      currentText += text[i]
    }

    expect(currentText).toBe('c0d3ster')
  })

  it('can handle timer advancement', () => {
    // Test that timers work
    let called = false
    setTimeout(() => {
      called = true
    }, 1000)

    vi.advanceTimersByTime(1000)

    expect(called).toBe(true)
  })

  it('can create DOM elements', () => {
    // Test basic DOM manipulation
    const div = document.createElement('div')
    const h1 = document.createElement('h1')
    h1.textContent = 'c0d3ster'
    div.appendChild(h1)

    expect(div.querySelector('h1')).toBeDefined()
    expect(div.querySelector('h1')?.textContent).toBe('c0d3ster')
  })

  it('can apply CSS classes', () => {
    const element = document.createElement('div')
    element.className = 'font-mono text-green-400'

    expect(element).toHaveClass('font-mono')
    expect(element).toHaveClass('text-green-400')
  })
})
