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
