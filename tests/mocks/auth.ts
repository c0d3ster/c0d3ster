import { vi } from 'vitest'

/**
 * Authentication-related mocks
 * Used in 3+ component test files
 */

export const createMockClerkUser = (overrides = {}) => ({
  user: null,
  isLoaded: true,
  isSignedIn: false,
  ...overrides,
})

export const createMockClerkAuth = (overrides = {}) => ({
  userId: null,
  isLoaded: true,
  isSignedIn: false,
  ...overrides,
})

export const createMockClerkServer = () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
  clerkClient: {
    users: {
      getUser: vi.fn().mockResolvedValue(null),
    },
  },
})
