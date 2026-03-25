import { ALLOWED_IMAGE_TYPES } from '@/constants/file'

export function normalizeImageContentType(ct: string): string {
  const base = ct.split(';')[0]?.trim().toLowerCase() ?? ''
  if (base === 'image/jpg') return 'image/jpeg'
  return base
}

export function isAllowedImageContentType(ct: string): boolean {
  const n = normalizeImageContentType(ct)
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(n)
}
