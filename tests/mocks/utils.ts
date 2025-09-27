import { vi } from 'vitest'

/**
 * Utility function mocks
 * Used in 8+ test files (3 service tests + 5 component tests)
 */

export const createMockUtils = (overrides = {}) => ({
  isAdminRole: vi.fn(),
  isDeveloperOrHigherRole: vi.fn(),
  findProjectBySlug: vi.fn(),
  hasSlugConflict: vi.fn(),
  formatProfileDate: (date: string) => new Date(date).toLocaleDateString(),
  ...overrides,
})
