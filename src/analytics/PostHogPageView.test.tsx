import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SuspendedPostHogPageView } from './PostHogPageView'

// Mock PostHog
const mockPostHog = {
  capture: vi.fn(),
}

vi.mock('posthog-js', () => ({
  default: mockPostHog,
}))

vi.mock('posthog-js/react', () => ({
  usePostHog: () => mockPostHog,
}))

// Mock usePathname and useSearchParams
const mockPathname = '/test-path'
const mockSearchParams = new URLSearchParams('?test=value')
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}))

describe('SuspendedPostHogPageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(<SuspendedPostHogPageView />)

    expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview', {
      $current_url: 'http://localhost:3000/test-path?test=value',
    })
  })

  it('should capture pageview on mount', () => {
    render(<SuspendedPostHogPageView />)

    expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview', {
      $current_url: 'http://localhost:3000/test-path?test=value',
    })
  })
})
