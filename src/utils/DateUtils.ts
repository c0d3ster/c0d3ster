/**
 * Shared date utility functions for consistent date handling across the application
 */

type DateInput = string | number | Date | null | undefined

type DateFormatOptions = {
  includeTime?: boolean
  includeSeconds?: boolean
  format?: 'short' | 'medium' | 'long' | 'full'
  locale?: string
}

/**
 * Parses various date formats into a Date object
 * Handles ISO strings, numeric timestamps, and Date objects
 */
const parseTimestamp = (value: DateInput): number | null => {
  if (!value) return null

  try {
    // If it's already a Date object
    if (value instanceof Date) {
      return value.getTime()
    }

    // If it's a number (timestamp)
    if (typeof value === 'number') {
      return value
    }

    // If it's a string
    if (typeof value === 'string') {
      // Check if it's a numeric timestamp string
      if (/^\d+$/.test(value)) {
        const timestamp = Number.parseInt(value, 10)
        return Number.isFinite(timestamp) ? timestamp : null
      }

      // Try parsing as ISO string or other format
      const date = new Date(value)
      return Number.isFinite(date.getTime()) ? date.getTime() : null
    }

    return null
  } catch {
    return null
  }
}

/**
 * Formats a date for display with consistent options
 */
const formatDate = (
  value: DateInput,
  options: DateFormatOptions = {}
): string => {
  const {
    includeTime = false,
    includeSeconds = false,
    format = 'medium',
    locale = 'en-US',
  } = options

  const timestamp = parseTimestamp(value)
  if (timestamp === null) return 'Invalid date'

  const date = new Date(timestamp)

  try {
    if (includeTime) {
      // Use toLocaleString for date + time
      return date.toLocaleString(locale, {
        year: 'numeric',
        month:
          format === 'short' ? 'short' : format === 'long' ? 'long' : 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        hour12: true,
      })
    } else {
      // Use toLocaleDateString for date only
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month:
          format === 'short' ? 'short' : format === 'long' ? 'long' : 'short',
        day: 'numeric',
      })
    }
  } catch (error) {
    console.error('Error formatting date:', { value, options, error })
    return 'Invalid date'
  }
}

/**
 * Formats a date for display in status history (date + time, short format)
 */
export const formatStatusDate = (value: DateInput): string => {
  return formatDate(value, {
    includeTime: true,
    format: 'short',
    locale: 'en-US',
  })
}

/**
 * Formats a date for display in cards (date only, short format)
 */
export const formatCardDate = (value: DateInput): string => {
  return formatDate(value, {
    includeTime: false,
    format: 'short',
    locale: 'en-US',
  })
}

/**
 * Formats a date for display in user profile (date only, long format)
 */
export const formatProfileDate = (value: DateInput): string => {
  return formatDate(value, {
    includeTime: false,
    format: 'long',
    locale: 'en-US',
  })
}

/**
 * Formats a date for sorting purposes (returns timestamp)
 */
export const getSortableTimestamp = (value: DateInput): number => {
  const timestamp = parseTimestamp(value)
  return timestamp ?? 0
}
