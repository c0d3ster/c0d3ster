import { describe, expect, it } from 'vitest'

import { isAdminRole, isDeveloperOrHigherRole } from './RoleConstants'

describe('RoleConstants', () => {
  describe('isAdminRole', () => {
    it('should return true for admin role (lowercase)', () => {
      expect(isAdminRole('admin')).toBe(true)
    })

    it('should return true for super_admin role (lowercase)', () => {
      expect(isAdminRole('super_admin')).toBe(true)
    })

    it('should return true for Admin role (PascalCase)', () => {
      expect(isAdminRole('Admin')).toBe(true)
    })

    it('should return true for SuperAdmin role (PascalCase)', () => {
      expect(isAdminRole('SuperAdmin')).toBe(true)
    })

    it('should return false for non-admin roles', () => {
      expect(isAdminRole('client')).toBe(false)
      expect(isAdminRole('developer')).toBe(false)
      expect(isAdminRole('user')).toBe(false)
    })

    it('should return false for null/undefined values', () => {
      expect(isAdminRole(null)).toBe(false)
      expect(isAdminRole(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isAdminRole('')).toBe(false)
    })
  })

  describe('isDeveloperOrHigherRole', () => {
    it('should return true for developer role (lowercase)', () => {
      expect(isDeveloperOrHigherRole('developer')).toBe(true)
    })

    it('should return true for Developer role (PascalCase)', () => {
      expect(isDeveloperOrHigherRole('Developer')).toBe(true)
    })

    it('should return true for admin roles', () => {
      expect(isDeveloperOrHigherRole('admin')).toBe(true)
      expect(isDeveloperOrHigherRole('super_admin')).toBe(true)
      expect(isDeveloperOrHigherRole('Admin')).toBe(true)
      expect(isDeveloperOrHigherRole('SuperAdmin')).toBe(true)
    })

    it('should return false for client role', () => {
      expect(isDeveloperOrHigherRole('client')).toBe(false)
    })

    it('should return false for null/undefined values', () => {
      expect(isDeveloperOrHigherRole(null)).toBe(false)
      expect(isDeveloperOrHigherRole(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isDeveloperOrHigherRole('')).toBe(false)
    })
  })
})
