import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AnimatedHeading } from './AnimatedHeading'

// Mock child components
vi.mock('@/components/atoms', () => ({
  __esModule: true,
  ScrollFade: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='scroll-fade'>{children}</div>
  ),
  TypewriterEffect: ({
    text,
    className,
  }: {
    text: string
    className?: string
  }) => (
    <span data-testid='typewriter' className={className}>
      {text}
    </span>
  ),
}))

describe('AnimatedHeading', () => {
  it('renders with default props', () => {
    render(<AnimatedHeading text='Test Heading' />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Test Heading')).toBeInTheDocument()
  })

  it('renders with specified heading level', () => {
    render(<AnimatedHeading text='Test Heading' level='h2' />)

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders different heading levels correctly', () => {
    const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

    levels.forEach((level, index) => {
      const { unmount } = render(
        <AnimatedHeading text={`Heading ${level}`} level={level} />
      )

      expect(
        screen.getByRole('heading', { level: index + 1 })
      ).toBeInTheDocument()

      unmount()
    })
  })

  it('wraps content in ScrollFade component', () => {
    render(<AnimatedHeading text='Test Heading' />)

    expect(screen.getAllByTestId('scroll-fade')[0]).toBeInTheDocument()
  })

  it('renders without typewriter effect by default', () => {
    render(<AnimatedHeading text='Test Heading' />)

    expect(screen.queryByTestId('typewriter')).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading')[0]).toBeInTheDocument()
  })

  it('renders with typewriter effect when enabled', () => {
    render(<AnimatedHeading text='Test Heading' withTypewriter={true} />)

    expect(screen.getByTestId('typewriter')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('passes typewriter props correctly', () => {
    render(
      <AnimatedHeading
        text='Test Heading'
        withTypewriter={true}
        typewriterSpeed={150}
        keepCursor={true}
      />
    )

    const typewriters = screen.getAllByTestId('typewriter')
    const typewriter = typewriters[typewriters.length - 1]

    expect(typewriter).toBeInTheDocument()
    expect(typewriter).toHaveTextContent('Test Heading')
  })

  it('applies custom className', () => {
    const customClass = 'custom-heading-class'
    render(<AnimatedHeading text='Test Heading' className={customClass} />)

    const headings = screen.getAllByRole('heading')
    const headingWithCustomClass = headings.find((heading) =>
      heading.classList.contains(customClass)
    )

    expect(headingWithCustomClass).toBeInTheDocument()
  })

  it('handles empty text', () => {
    render(<AnimatedHeading text='' />)

    expect(screen.getAllByRole('heading')[0]).toBeInTheDocument()
  })

  it('handles long text content', () => {
    const longText =
      'This is a very long heading text that should be handled properly by the component without any issues'
    render(<AnimatedHeading text={longText} />)

    expect(screen.getByText(longText)).toBeInTheDocument()
  })

  it('applies different variants', () => {
    const variants = ['hero', 'section', 'subtitle'] as const

    variants.forEach((variant) => {
      const { unmount } = render(
        <AnimatedHeading text={`${variant} heading`} variant={variant} />
      )

      expect(screen.getAllByRole('heading')[0]).toBeInTheDocument()

      unmount()
    })
  })
})
