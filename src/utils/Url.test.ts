import { describe, expect, it } from 'vitest'

import { normalizeHttpUrl } from './Url'

describe('normalizeHttpUrl', () => {
  it('returns null for empty input', () => {
    expect(normalizeHttpUrl('')).toBeNull()
    expect(normalizeHttpUrl('   ')).toBeNull()
  })

  it('prefixes bare domains with https', () => {
    expect(normalizeHttpUrl('example.com')).toBe('https://example.com/')
  })

  it('accepts valid http and https URLs', () => {
    expect(normalizeHttpUrl('https://example.com/path')).toBe(
      'https://example.com/path'
    )
    expect(normalizeHttpUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/'
    )
  })

  it('rejects invalid schemes and malformed URLs', () => {
    expect(normalizeHttpUrl('ftp://example.com')).toBeNull()
    expect(normalizeHttpUrl('not a url')).toBeNull()
    expect(normalizeHttpUrl('://bad')).toBeNull()
  })
})
