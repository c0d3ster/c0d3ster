import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LandingPageTemplate } from './LandingPageTemplate'

// Mock child components
vi.mock('@/components/atoms', () => ({
  __esModule: true,
  MatrixBackground: () => <canvas data-testid='matrix-background' />,
}))

describe('LandingPageTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders children correctly', () => {
    const testContent = 'Test landing page content'
    render(
      <LandingPageTemplate>
        <div>{testContent}</div>
      </LandingPageTemplate>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('renders MatrixBackground component', () => {
    render(
      <LandingPageTemplate>
        <div>content</div>
      </LandingPageTemplate>
    )

    expect(screen.getByTestId('matrix-background')).toBeInTheDocument()
  })

  it('renders MatrixBackground before content', () => {
    render(
      <LandingPageTemplate>
        <div data-testid='test-content'>content</div>
      </LandingPageTemplate>
    )

    const background = screen.getByTestId('matrix-background')
    const content = screen.getByTestId('test-content')

    // MatrixBackground should be rendered before the content in the DOM
    expect(background.compareDocumentPosition(content)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  })

  it('handles multiple children', () => {
    render(
      <LandingPageTemplate>
        <header>Header content</header>
        <main>Main content</main>
        <footer>Footer content</footer>
      </LandingPageTemplate>
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('handles React fragments as children', () => {
    render(
      <LandingPageTemplate>
        <>
          <div>Fragment child 1</div>
          <div>Fragment child 2</div>
        </>
      </LandingPageTemplate>
    )

    expect(screen.getByText('Fragment child 1')).toBeInTheDocument()
    expect(screen.getByText('Fragment child 2')).toBeInTheDocument()
  })

  it('handles complex landing page structure', () => {
    render(
      <LandingPageTemplate>
        <header data-testid='header'>
          <nav>Navigation</nav>
        </header>
        <section data-testid='hero'>Hero Section</section>
        <section data-testid='portfolio'>Portfolio Section</section>
        <section data-testid='contact'>Contact Section</section>
      </LandingPageTemplate>
    )

    expect(screen.getByTestId('matrix-background')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('portfolio')).toBeInTheDocument()
    expect(screen.getByTestId('contact')).toBeInTheDocument()
  })

  it('handles empty children gracefully', () => {
    render(<LandingPageTemplate>{null}</LandingPageTemplate>)

    // Should still render MatrixBackground and container structure
    expect(screen.getByTestId('matrix-background')).toBeInTheDocument()

    const container = document.querySelector('.relative.min-h-screen')

    expect(container).toBeInTheDocument()
  })

  it('handles string children', () => {
    render(<LandingPageTemplate>Simple string content</LandingPageTemplate>)

    expect(screen.getByText('Simple string content')).toBeInTheDocument()
    expect(screen.getByTestId('matrix-background')).toBeInTheDocument()
  })

  it('ensures background and content coexist', () => {
    render(
      <LandingPageTemplate>
        <div data-testid='content'>Landing content</div>
      </LandingPageTemplate>
    )

    // Both background and content should be present
    expect(screen.getByTestId('matrix-background')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('maintains template structure with dynamic content', () => {
    const { rerender } = render(
      <LandingPageTemplate>
        <div>Initial content</div>
      </LandingPageTemplate>
    )

    expect(screen.getByText('Initial content')).toBeInTheDocument()
    expect(screen.getByTestId('matrix-background')).toBeInTheDocument()

    rerender(
      <LandingPageTemplate>
        <div>Updated content</div>
      </LandingPageTemplate>
    )

    expect(screen.getByText('Updated content')).toBeInTheDocument()
    expect(screen.getByTestId('matrix-background')).toBeInTheDocument()
  })
})
