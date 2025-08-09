import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionWrapper } from './SectionWrapper'

describe('SectionWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup() // Clean up any previous renders
  })

  afterEach(() => {
    cleanup() // Clean up after each test
  })

  it('renders children correctly', () => {
    const testContent = 'Test section content'
    render(
      <SectionWrapper id='test-section'>
        <div>{testContent}</div>
      </SectionWrapper>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('applies the provided id', () => {
    const testId = 'test-section'
    render(
      <SectionWrapper id={testId}>
        <div>content</div>
      </SectionWrapper>
    )

    const section = document.querySelector('section')

    expect(section).toHaveAttribute('id', testId)
  })

  it('renders as a section element', () => {
    render(
      <SectionWrapper id='test'>
        <div>content</div>
      </SectionWrapper>
    )

    const section = document.querySelector('section')

    expect(section?.tagName).toBe('SECTION')
  })

  it('applies custom className when provided', () => {
    const customClass = 'custom-section'
    render(
      <SectionWrapper id='test' className={customClass}>
        <div>content</div>
      </SectionWrapper>
    )

    const section = document.querySelector('section')

    expect(section).toHaveClass(customClass)
  })

  it('merges custom className with default classes', () => {
    const customClass = 'custom-section'
    render(
      <SectionWrapper id='test' className={customClass}>
        <div>content</div>
      </SectionWrapper>
    )

    const section = document.querySelector('section')

    expect(section).toHaveClass(
      'relative',
      'z-10',
      'min-h-screen',
      'py-16',
      customClass
    )
  })

  it('handles empty className prop', () => {
    render(
      <SectionWrapper id='test' className=''>
        <div>content</div>
      </SectionWrapper>
    )

    const section = document.querySelector('section')

    expect(section).toHaveClass('relative', 'z-10', 'min-h-screen', 'py-16')
  })

  it('handles multiple children', () => {
    render(
      <SectionWrapper id='test'>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </SectionWrapper>
    )

    expect(screen.getByText('First child')).toBeInTheDocument()
    expect(screen.getByText('Second child')).toBeInTheDocument()
    expect(screen.getByText('Third child')).toBeInTheDocument()
  })

  it('accepts React fragments as children', () => {
    render(
      <SectionWrapper id='test'>
        <>
          <div>Fragment child 1</div>
          <div>Fragment child 2</div>
        </>
      </SectionWrapper>
    )

    expect(screen.getByText('Fragment child 1')).toBeInTheDocument()
    expect(screen.getByText('Fragment child 2')).toBeInTheDocument()
  })
})
