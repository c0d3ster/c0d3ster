// File upload constants
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function normalizeImageContentType(ct: string): string {
  const t = ct.toLowerCase().trim()
  if (t === 'image/jpg') return 'image/jpeg'
  return t
}

export function isAllowedImageContentType(ct: string): boolean {
  const n = normalizeImageContentType(ct)
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(n)
}
