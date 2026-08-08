import { describe, expect, it } from 'vitest'

import {
  isAllowedImageContentType,
  isAllowedProjectFileContentType,
  isPublicUrl,
  normalizeImageContentType,
  normalizeProjectFileContentType,
} from '@/utils/File'

describe('File utils', () => {
  describe('normalizeImageContentType', () => {
    it('strips MIME parameters before normalizing', () => {
      expect(normalizeImageContentType('image/jpeg; charset=binary')).toBe(
        'image/jpeg'
      )
    })

    it('maps image/jpg to image/jpeg', () => {
      expect(normalizeImageContentType('image/jpg')).toBe('image/jpeg')
    })
  })

  describe('isAllowedImageContentType', () => {
    it('accepts image/jpeg with parameters', () => {
      expect(isAllowedImageContentType('image/jpeg; charset=binary')).toBe(true)
    })

    it('rejects non-image types', () => {
      expect(isAllowedImageContentType('application/pdf')).toBe(false)
    })
  })

  describe('isPublicUrl', () => {
    it('accepts http(s) URLs', () => {
      expect(isPublicUrl('https://example.com/logo.png')).toBe(true)
      expect(isPublicUrl('http://example.com/logo.png')).toBe(true)
    })

    it('accepts local asset paths', () => {
      expect(isPublicUrl('/assets/logo.png')).toBe(true)
    })

    it('rejects bare R2 object keys', () => {
      expect(isPublicUrl('projects/123/1700000000000_logo.png')).toBe(false)
    })

    it('rejects null/undefined/empty', () => {
      expect(isPublicUrl(null)).toBe(false)
      expect(isPublicUrl(undefined)).toBe(false)
      expect(isPublicUrl('')).toBe(false)
    })
  })

  describe('normalizeProjectFileContentType', () => {
    it('strips MIME parameters and maps jpg to jpeg', () => {
      expect(normalizeProjectFileContentType('image/jpg; charset=binary')).toBe(
        'image/jpeg'
      )
    })
  })

  describe('isAllowedProjectFileContentType', () => {
    it('accepts images', () => {
      expect(isAllowedProjectFileContentType('image/png')).toBe(true)
    })

    it('accepts documents', () => {
      expect(isAllowedProjectFileContentType('application/pdf')).toBe(true)
      expect(isAllowedProjectFileContentType('text/plain')).toBe(true)
    })

    it('rejects disallowed types', () => {
      expect(isAllowedProjectFileContentType('application/x-msdownload')).toBe(
        false
      )
    })
  })
})
