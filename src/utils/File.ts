import type { Buffer } from 'node:buffer'

import { ALLOWED_IMAGE_TYPES, ALLOWED_PROJECT_FILE_TYPES } from '@/constants/file'

export function normalizeImageContentType(ct: string): string {
  const base = ct.split(';')[0]?.trim().toLowerCase() ?? ''
  if (base === 'image/jpg') return 'image/jpeg'
  return base
}

export function isAllowedImageContentType(ct: string): boolean {
  const n = normalizeImageContentType(ct)
  return ALLOWED_IMAGE_TYPES.includes(n)
}

// A project logo/file field is either a browser-loadable URL (public asset, or a
// presigned URL cached in local state) or a bare R2 object key that needs resolving
// via the `file` query before it can be used as an <Image> src.
export function isPublicUrl(url?: string | null): boolean {
  return !!url && (/^https?:\/\//.test(url) || url.startsWith('/assets/'))
}

export function normalizeProjectFileContentType(ct: string): string {
  return normalizeImageContentType(ct)
}

export function isAllowedProjectFileContentType(ct: string): boolean {
  const n = normalizeProjectFileContentType(ct)
  return ALLOWED_PROJECT_FILE_TYPES.includes(n)
}

// file-type has no magic-byte signature for plain text, so a text upload can
// never be positively sniffed. This heuristic is the one exception allowed to
// fall back on the declared Content-Type: reject anything containing a NUL
// byte or more than a trace of non-whitespace control characters, since real
// binary content (executables, images, etc.) reliably fails that check.
export function looksLikePlainText(buffer: Buffer): boolean {
  if (buffer.length === 0) return true
  if (buffer.includes(0)) return false

  let suspiciousCount = 0
  for (const byte of buffer) {
    const isAllowedControl = byte === 0x09 || byte === 0x0a || byte === 0x0d
    const isAsciiControlOrDel = byte < 0x20 || byte === 0x7f
    if (isAsciiControlOrDel && !isAllowedControl) {
      suspiciousCount++
    }
  }

  return suspiciousCount / buffer.length < 0.01
}
