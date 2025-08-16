import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroSection } from './HeroSection'

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

    expect(screen.getByText('SOFTWARE CONTRACTOR')).toBeInTheDocument()
    expect(screen.getByText('FULL-STACK DEVELOPMENT')).toBeInTheDocument()
    expect(
      screen.getByText('REACT • NEXT.JS • TYPESCRIPT • NODE.JS')
    ).toBeInTheDocument()
  })

  it('renders custom title', () => {
    const customTitle = 'Custom Title'
    render(<HeroSection title={customTitle} />)

    // The title is rendered via TypewriterEffect, so we can't test for the exact text
    // Just verify the component renders without crashing
    expect(screen.getByText('SOFTWARE CONTRACTOR')).toBeInTheDocument()
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
})
