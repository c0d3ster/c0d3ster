import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DevBadge } from './DevBadge'

describe('DevBadge', () => {
  it('renders with correct text', () => {
    render(<DevBadge />)
    
    expect(screen.getByText('DEV')).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    render(<DevBadge />)
    
    const badge = screen.getByText('DEV')
    
    expect(badge).toHaveClass(
      'inline-flex',
      'rounded-full',
      'bg-blue-400/20',
      'px-2',
      'py-1',
      'font-mono',
      'text-xs',
      'font-bold',
      'text-blue-400'
    )
  })

  it('renders as a span element', () => {
    render(<DevBadge />)
    
    const badge = screen.getByText('DEV')
    
    expect(badge.tagName).toBe('SPAN')
  })
})
