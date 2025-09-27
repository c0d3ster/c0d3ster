import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RootLayout from './layout'

// Mock Next.js components
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}))

// Mock providers
vi.mock('@/providers', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='clerk-provider'>{children}</div>
  ),
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='query-provider'>{children}</div>
  ),
}))

// Mock analytics
vi.mock('@/analytics', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='posthog-provider'>{children}</div>
  ),
  PostHogPageView: () => <div data-testid='posthog-pageview' />,
}))

// Mock Apollo Client
vi.mock('@apollo/client/react', () => ({
  ApolloProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='apollo-provider'>{children}</div>
  ),
}))

describe('RootLayout', () => {
  it('should render with all providers', () => {
    render(
      <RootLayout>
        <div data-testid='page-content'>Page Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument()
    expect(screen.getByTestId('posthog-provider')).toBeInTheDocument()
    expect(screen.getByTestId('apollo-provider')).toBeInTheDocument()
    expect(screen.getByTestId('query-provider')).toBeInTheDocument()
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('should have correct HTML structure', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    // Check that the html element exists and has the correct structure
    expect(document.documentElement.tagName).toBe('HTML')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
    expect(document.body).toBeInTheDocument()
  })
})
