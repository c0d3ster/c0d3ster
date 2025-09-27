import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ClientBadge } from './ClientBadge'

describe('ClientBadge', () => {
  it('renders with correct text', () => {
    render(<ClientBadge />)
    
    expect(screen.getByText('CLIENT')).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    render(<ClientBadge />)
    
    const badge = screen.getByText('CLIENT')
    
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'border-green-400/30',
      'bg-green-400/20',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-medium',
      'text-green-400'
    )
  })

  it('renders as a span element', () => {
    render(<ClientBadge />)
    
    const badge = screen.getByText('CLIENT')
    
    expect(badge.tagName).toBe('SPAN')
  })
})
