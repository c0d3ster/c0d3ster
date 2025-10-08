import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminBadge } from './AdminBadge'

describe('AdminBadge', () => {
  it('renders with correct text', () => {
    render(<AdminBadge />)
    
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    render(<AdminBadge />)
    
    const badge = screen.getByText('ADMIN')
    
    expect(badge).toHaveClass(
      'inline-flex',
      'rounded-full',
      'bg-purple-400/20',
      'px-2',
      'py-1',
      'font-mono',
      'text-xs',
      'font-bold',
      'text-purple-400'
    )
  })

  it('renders as a span element', () => {
    render(<AdminBadge />)
    
    const badge = screen.getByText('ADMIN')
    
    expect(badge.tagName).toBe('SPAN')
  })
})
