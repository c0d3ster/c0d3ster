import { describe, expect, it } from 'vitest'

import {
  formatCardDate,
  formatProfileDate,
  formatStatusDate,
  getSortableTimestamp,
} from './DateUtils'

describe('DateUtils', () => {
  const testDate = new Date('2024-01-15T14:30:45.123Z')
  const testTimestamp = testDate.getTime()
  const testDateString = '2024-01-15T14:30:45.123Z'

  describe('formatStatusDate', () => {
    it('should format date with time in short format', () => {
      const result = formatStatusDate(testDate)

      expect(result).toMatch(/Jan 15, 2024, \d{1,2}:\d{2} (AM|PM)/)
    })

    it('should handle Date objects', () => {
      const result = formatStatusDate(testDate)

      expect(result).toContain('Jan 15, 2024')
    })

    it('should handle timestamp numbers', () => {
      const result = formatStatusDate(testTimestamp)

      expect(result).toContain('Jan 15, 2024')
    })

    it('should handle ISO strings', () => {
      const result = formatStatusDate(testDateString)

      expect(result).toContain('Jan 15, 2024')
    })

    it('should handle null/undefined', () => {
      expect(formatStatusDate(null)).toBe('Invalid date')
      expect(formatStatusDate(undefined)).toBe('Invalid date')
    })
  })

  describe('formatCardDate', () => {
    it('should format date without time in short format', () => {
      const result = formatCardDate(testDate)

      expect(result).toBe('Jan 15, 2024')
    })

    it('should handle Date objects', () => {
      const result = formatCardDate(testDate)

      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should handle timestamp numbers', () => {
      const result = formatCardDate(testTimestamp)

      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should handle ISO strings', () => {
      const result = formatCardDate(testDateString)

      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should handle null/undefined', () => {
      expect(formatCardDate(null)).toBe('Invalid date')
      expect(formatCardDate(undefined)).toBe('Invalid date')
    })
  })

  describe('formatProfileDate', () => {
    it('should format date in long format', () => {
      const result = formatProfileDate(testDate)

      expect(result).toMatch(/January 15, 2024/)
    })

    it('should handle Date objects', () => {
      const result = formatProfileDate(testDate)

      expect(result).toMatch(/January 15, 2024/)
    })

    it('should handle timestamp numbers', () => {
      const result = formatProfileDate(testTimestamp)

      expect(result).toMatch(/January 15, 2024/)
    })

    it('should handle ISO strings', () => {
      const result = formatProfileDate(testDateString)

      expect(result).toMatch(/January 15, 2024/)
    })

    it('should handle null/undefined', () => {
      expect(formatProfileDate(null)).toBe('Invalid date')
      expect(formatProfileDate(undefined)).toBe('Invalid date')
    })
  })

  describe('getSortableTimestamp', () => {
    it('should return timestamp for valid dates', () => {
      expect(getSortableTimestamp(testDate)).toBe(testTimestamp)
      expect(getSortableTimestamp(testTimestamp)).toBe(testTimestamp)
      expect(getSortableTimestamp(testDateString)).toBe(testTimestamp)
    })

    it('should return 0 for invalid dates', () => {
      expect(getSortableTimestamp(null)).toBe(0)
      expect(getSortableTimestamp(undefined)).toBe(0)
      expect(getSortableTimestamp('invalid')).toBe(0)
      expect(getSortableTimestamp('')).toBe(0)
    })

    it('should handle numeric timestamp strings', () => {
      expect(getSortableTimestamp(testTimestamp.toString())).toBe(testTimestamp)
    })
  })
})
