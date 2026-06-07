import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RootLayout from './layout'

vi.mock('@/providers', () => ({
  ClientProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='client-providers'>{children}</div>
  ),
}))

describe('RootLayout', () => {
  it('should render with providers', () => {
    render(
      <RootLayout>
        <div data-testid='page-content'>Page Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('client-providers')).toBeInTheDocument()
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('should have correct HTML structure', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    expect(document.documentElement.tagName).toBe('HTML')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
    expect(document.body).toBeInTheDocument()
  })
})
