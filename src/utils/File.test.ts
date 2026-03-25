import { describe, expect, it } from 'vitest'

import {
  isAllowedImageContentType,
  normalizeImageContentType,
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
})
