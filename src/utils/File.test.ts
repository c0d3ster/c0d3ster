import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'

import {
  isAllowedImageContentType,
  isAllowedProjectFileContentType,
  isPublicUrl,
  looksLikePlainText,
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

  describe('looksLikePlainText', () => {
    it('accepts plain ASCII text', () => {
      expect(looksLikePlainText(Buffer.from('hello world\nline two'))).toBe(true)
    })

    it('accepts text with tabs and CRLF line endings', () => {
      expect(looksLikePlainText(Buffer.from('a\tb\r\nc\r\nd'))).toBe(true)
    })

    it('accepts an empty buffer', () => {
      expect(looksLikePlainText(Buffer.alloc(0))).toBe(true)
    })

    it('rejects a buffer containing a NUL byte', () => {
      expect(looksLikePlainText(Buffer.from([0x68, 0x69, 0x00, 0x21]))).toBe(
        false
      )
    })

    it('rejects binary content with lots of control bytes', () => {
      const binary = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05])

      expect(looksLikePlainText(binary)).toBe(false)
    })
  })
})
