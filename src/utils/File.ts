import { ALLOWED_IMAGE_TYPES } from '@/constants/file'

export function normalizeImageContentType(ct: string): string {
  const t = ct.toLowerCase().trim()
  if (t === 'image/jpg') return 'image/jpeg'
  return t
}

export function isAllowedImageContentType(ct: string): boolean {
  const n = normalizeImageContentType(ct)
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(n)
}
