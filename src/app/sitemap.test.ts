import { describe, expect, it } from 'vitest'

import GET from './sitemap'

describe('sitemap.xml', () => {
  it('should return sitemap.xml content', () => {
    const response = GET()

    expect(response).toBeDefined()
    expect(Array.isArray(response)).toBe(true)
    expect(response.length).toBeGreaterThan(0)
    expect(response[0]).toHaveProperty('url')
    expect(response[0]).toHaveProperty('lastModified')
    expect(response[0]).toHaveProperty('changeFrequency')
    expect(response[0]).toHaveProperty('priority')
  })
})
