import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ContactMethod } from './types'

import { ContactMethodCard } from './ContactMethodCard'

const mockContactMethod: ContactMethod = {
  title: 'Email',
  value: 'test@example.com',
  icon: '📧',
  link: 'mailto:test@example.com',
}

describe('ContactMethodCard', () => {
  it('renders contact method information correctly', () => {
    render(<ContactMethodCard method={mockContactMethod} />)

    expect(screen.getByText('📧')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders as a clickable link with correct attributes', () => {
    render(<ContactMethodCard method={mockContactMethod} />)

    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('href', 'mailto:test@example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies correct styling classes', () => {
    render(<ContactMethodCard method={mockContactMethod} />)

    const card = screen.getByRole('link').parentElement

    expect(card).toHaveClass(
      'group',
      'relative',
      'overflow-hidden',
      'rounded-lg',
      'border',
      'border-green-400/20',
      'bg-black/80',
      'p-4',
      'text-center',
      'transition-all',
      'duration-300',
      'hover:border-green-400/40',
      'hover:bg-green-400/5'
    )
  })

  it('renders decorative elements', () => {
    render(<ContactMethodCard method={mockContactMethod} />)

    const card = screen.getByRole('link').parentElement
    const decorativeElements = card?.querySelectorAll('div[class*="absolute"]')

    expect(decorativeElements).toHaveLength(2)
  })

  it('handles different contact method types', () => {
    const phoneMethod: ContactMethod = {
      title: 'Phone',
      value: '+1 (555) 123-4567',
      icon: '📞',
      link: 'tel:+15551234567',
    }

    render(<ContactMethodCard method={phoneMethod} />)

    expect(screen.getByText('📞')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument()

    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('href', 'tel:+15551234567')
  })

  it('handles social media contact methods', () => {
    const socialMethod: ContactMethod = {
      title: 'LinkedIn',
      value: 'linkedin.com/in/username',
      icon: '💼',
      link: 'https://linkedin.com/in/username',
    }

    render(<ContactMethodCard method={socialMethod} />)

    expect(screen.getByText('💼')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('linkedin.com/in/username')).toBeInTheDocument()

    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/username')
  })
})
