import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Mock process if it doesn't exist (for Node.js compatibility)
if (typeof process === 'undefined') {
  globalThis.process = {
    env: {},
    cwd: () => '',
    platform: 'browser',
  } as any
}

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})
