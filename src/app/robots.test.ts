import { describe, expect, it } from 'vitest'

import GET from './robots'

describe('robots.txt', () => {
  it('should return robots.txt content', () => {
    const response = GET()

    expect(response).toBeDefined()
    expect(response.rules).toBeDefined()

    // Handle both array and object cases for rules
    if (Array.isArray(response.rules)) {
      expect(response.rules[0]?.userAgent).toBe('*')
      expect(response.rules[0]?.allow).toBe('/')
      expect(response.rules[0]?.disallow).toBe('/dashboard/')
    } else {
      expect(response.rules?.userAgent).toBe('*')
      expect(response.rules?.allow).toBe('/')
      expect(response.rules?.disallow).toBe('/dashboard/')
    }

    expect(response.sitemap).toContain('/sitemap.xml')
  })
})
