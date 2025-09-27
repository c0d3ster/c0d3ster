import { describe, expect, it, vi } from 'vitest'

import {
  useDeleteFile,
  useGetFile,
  useGetFiles,
  useUploadProjectLogo,
} from './fileApiClient'

// Mock Apollo Client
vi.mock('@/libs/ApolloClient', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}))

describe('File API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exports', () => {
    it('should export all required functions', () => {
      expect(useGetFile).toBeDefined()
      expect(useGetFiles).toBeDefined()
      expect(useUploadProjectLogo).toBeDefined()
      expect(useDeleteFile).toBeDefined()
    })
  })
})
