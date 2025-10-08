import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PostHogProvider } from './PostHogProvider'

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}))

// Mock environment
vi.mock('@/libs/Env', () => ({
  Env: {
    NODE_ENV: 'development',
    POSTHOG_KEY: 'test-posthog-key',
    POSTHOG_HOST: 'https://app.posthog.com',
  },
}))

describe('PostHogProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <PostHogProvider>
        <div data-testid='child'>Test Child</div>
      </PostHogProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should render without crashing', () => {
    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    // Just verify it renders without errors
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
