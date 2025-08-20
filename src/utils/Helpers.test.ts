import { describe, expect, it } from 'vitest'

import { getBaseUrl, isServer } from './Helpers'

describe('Helpers', () => {
  describe('getBaseUrl function', () => {
    it('should return NEXT_PUBLIC_APP_URL when set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
      
      expect(getBaseUrl()).toBe('https://example.com')
      
      process.env.NEXT_PUBLIC_APP_URL = originalEnv
    })

    it('should return localhost when no environment variables are set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL
      
      expect(getBaseUrl()).toBe('http://localhost:3000')
      
      if (originalEnv) {
        process.env.NEXT_PUBLIC_APP_URL = originalEnv
      }
    })
  })

  describe('isServer function', () => {
    it('should return true when running on server', () => {
      expect(isServer()).toBe(true)
    })
  })
})
