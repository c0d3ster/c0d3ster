import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getBaseUrl, isServer } from './Helpers'

describe('Helpers', () => {
  // Snapshot/restore environment for each test to avoid cross-test bleed
  let ORIGINAL_ENV: NodeJS.ProcessEnv

  beforeEach(() => {
    ORIGINAL_ENV = { ...process.env }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  describe('getBaseUrl function', () => {
    it('should return NEXT_PUBLIC_APP_URL when set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      expect(getBaseUrl()).toBe('https://example.com')
    })

    it('should return localhost when no environment variables are set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      delete process.env.VERCEL_ENV
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL
      delete process.env.VERCEL_URL

      expect(getBaseUrl()).toBe('http://localhost:3000')
    })
  })

  describe('isServer function', () => {
    it('should return true when running on server', () => {
      expect(isServer()).toBe(true)
    })
  })
})
