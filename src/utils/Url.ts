/**
 * Normalize user-entered URLs to a valid http(s) href, or return null if invalid.
 * Bare domains (e.g. example.com) are prefixed with https://.
 */
export function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null
  }

  let candidate = trimmed
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`
  }

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    return url.href
  } catch {
    return null
  }
}
