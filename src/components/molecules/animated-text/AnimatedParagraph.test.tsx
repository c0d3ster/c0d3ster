import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimatedParagraph } from './AnimatedParagraph'

// Mock child components
vi.mock('@/components/atoms', () => ({
  __esModule: true,
  ScrollFade: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='scroll-fade'>{children}</div>
  ),
}))

describe('AnimatedParagraph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders children correctly', () => {
    const testContent = 'This is test paragraph content'
    render(<AnimatedParagraph>{testContent}</AnimatedParagraph>)

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('renders as a paragraph element', () => {
    render(<AnimatedParagraph>Test content</AnimatedParagraph>)

    const paragraph = screen.getByText('Test content')

    expect(paragraph.tagName).toBe('P')
  })

  it('wraps content in ScrollFade component', () => {
    render(<AnimatedParagraph>Test content</AnimatedParagraph>)

    expect(screen.getByTestId('scroll-fade')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-paragraph-class'
    render(
      <AnimatedParagraph className={customClass}>
        Test content
      </AnimatedParagraph>
    )

    const paragraph = screen.getByText('Test content')

    expect(paragraph).toHaveClass(customClass)
  })

  it('handles different variants', () => {
    const variants = ['default', 'large', 'small'] as const

    variants.forEach((variant) => {
      render(
        <AnimatedParagraph variant={variant}>
          {variant} content
        </AnimatedParagraph>
      )

      expect(screen.getByText(`${variant} content`)).toBeInTheDocument()

      cleanup()
    })
  })

  it('handles React elements as children', () => {
    render(
      <AnimatedParagraph>
        <span>Child span</span>
        <strong>Bold text</strong>
      </AnimatedParagraph>
    )

    expect(screen.getByText('Child span')).toBeInTheDocument()
    expect(screen.getByText('Bold text')).toBeInTheDocument()
  })

  it('handles complex nested content', () => {
    render(
      <AnimatedParagraph>
        This is a paragraph with <em>emphasized</em> and <strong>bold</strong>{' '}
        text.
      </AnimatedParagraph>
    )

    expect(screen.getByText('emphasized')).toBeInTheDocument()
    expect(screen.getByText('bold')).toBeInTheDocument()
  })

  it('handles null children gracefully', () => {
    render(<AnimatedParagraph>{null}</AnimatedParagraph>)

    const paragraph = screen.getByRole('paragraph')

    expect(paragraph).toBeInTheDocument()
  })

  it('handles multiple text nodes', () => {
    render(
      <AnimatedParagraph>First text node Second text node</AnimatedParagraph>
    )

    expect(
      screen.getByText(/First text node\s+Second text node/)
    ).toBeInTheDocument()
  })

  it('applies default variant when none specified', () => {
    render(<AnimatedParagraph>Default variant content</AnimatedParagraph>)

    expect(screen.getByText('Default variant content')).toBeInTheDocument()
  })
})
