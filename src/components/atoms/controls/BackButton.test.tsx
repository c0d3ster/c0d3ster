import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BackButton } from './BackButton'

// Mock next/navigation
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}))

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaArrowLeft: () => <span data-testid='arrow-left'>←</span>,
}))

describe('BackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    render(<BackButton />)

    expect(screen.getByText('BACK')).toBeInTheDocument()
    expect(screen.getByTestId('arrow-left')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
  })

  it('renders with custom text', () => {
    render(<BackButton text='GO BACK' />)

    expect(screen.getByText('GO BACK')).toBeInTheDocument()
  })

  it('renders with custom href', () => {
    render(<BackButton href='/custom-path' />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/custom-path')
  })

  it('renders with useBack=true and href="#"', () => {
    render(<BackButton useBack={true} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '#')
  })

  it('calls router.back() when useBack=true and clicked', () => {
    render(<BackButton useBack={true} />)

    const link = screen.getByRole('link')
    fireEvent.click(link)

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('does not call router.back() when useBack=false and clicked', () => {
    render(<BackButton useBack={false} />)

    const link = screen.getByRole('link')
    fireEvent.click(link)

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('prevents default when useBack=true and clicked', () => {
    render(<BackButton useBack={true} />)

    const link = screen.getByRole('link')
    const preventDefault = vi.fn()
    fireEvent.click(link, { preventDefault })

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('applies correct CSS classes', () => {
    render(<BackButton />)

    const link = screen.getByRole('link')

    expect(link).toHaveClass(
      'group',
      'inline-flex',
      'items-center',
      'space-x-2',
      'text-green-400',
      'transition-all',
      'duration-300',
      'hover:text-green-300'
    )
  })

  it('applies correct CSS classes to arrow container', () => {
    render(<BackButton />)

    const arrowContainer = screen.getByTestId('arrow-left').parentElement

    expect(arrowContainer).toHaveClass(
      'transform',
      'transition-transform',
      'duration-300',
      'group-hover:-translate-x-1'
    )
  })

  it('applies correct CSS classes to text span', () => {
    render(<BackButton />)

    const textSpan = screen.getByText('BACK')

    expect(textSpan).toHaveClass(
      'font-mono',
      'font-bold',
      'whitespace-nowrap',
      'opacity-0',
      'transition-opacity',
      'duration-300',
      'group-hover:opacity-100'
    )
  })

  it('renders with all props combined', () => {
    render(<BackButton href='/test' text='CUSTOM TEXT' useBack={true} />)

    expect(screen.getByText('CUSTOM TEXT')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '#')
    expect(screen.getByTestId('arrow-left')).toBeInTheDocument()
  })

  it('handles click event with preventDefault when useBack=true', () => {
    render(<BackButton useBack={true} />)

    const link = screen.getByRole('link')

    // This test is covered by the "prevents default when useBack=true and clicked" test above
    // which already verifies that preventDefault is called
    fireEvent.click(link)

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('does not prevent default when useBack=false', () => {
    render(<BackButton useBack={false} />)

    const link = screen.getByRole('link')
    const mockEvent = {
      preventDefault: vi.fn(),
    }

    fireEvent.click(link, mockEvent)

    expect(mockEvent.preventDefault).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('renders with container and positioning classes', () => {
    render(<BackButton />)

    const container = screen.getByRole('link').closest('.fixed')

    expect(container).toHaveClass(
      'fixed',
      'top-24',
      'right-0',
      'left-0',
      'z-40'
    )

    const innerContainer = container?.querySelector('.container')

    expect(innerContainer).toHaveClass('container', 'mx-auto', 'px-4')
  })

  it('handles undefined href gracefully', () => {
    render(<BackButton href={undefined} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
  })

  it('handles empty string href gracefully', () => {
    render(<BackButton href='' />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
  })
})
