import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  beforeEach(() => {
    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
  })

  it('renders with default props', async () => {
    render(<HeroSection />)

    // Wait for the TypewriterEffect text to appear
    await waitFor(() => {
      expect(screen.getByText('SOFTWARE CONTRACTOR')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('FULL-STACK DEVELOPMENT')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(
        screen.getByText('REACT • NEXT.JS • TYPESCRIPT • NODE.JS')
      ).toBeInTheDocument()
    })
  })

  it('renders custom title', async () => {
    const customTitle = 'Custom Title'
    render(<HeroSection title={customTitle} />)

    // Wait for the custom title to appear via TypewriterEffect
    // Increase timeout since TypewriterEffect takes time to type each character
    await waitFor(
      () => {
        expect(screen.getByText(customTitle)).toBeInTheDocument()
      },
      { timeout: 3000 }
    ) // 3 second timeout
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
