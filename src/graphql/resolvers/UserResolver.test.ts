import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it } from 'vitest'

import type { UpdateUserInput } from '@/graphql/schema'

import { UserResolver } from '@/graphql/resolvers/UserResolver'
import { UserRole } from '@/graphql/schema'
import { createMockUser } from '@/tests/mocks/auth'
import { createMockUserService } from '@/tests/mocks/services'

describe('UserResolver', () => {
  let userResolver: UserResolver
  let mockUserService: ReturnType<typeof createMockUserService>

  beforeEach(() => {
    mockUserService = createMockUserService()
    userResolver = new UserResolver(mockUserService as any)
  })

  describe('me', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(mockUser)

      const result = await userResolver.me()

      expect(result).toEqual(mockUser)
      expect(mockUserService.getCurrentUserWithAuth).toHaveBeenCalledOnce()
    })

    it('should throw error when not authenticated', async () => {
      const error = new Error('Not authenticated')
      mockUserService.getCurrentUserWithAuth.mockRejectedValue(error)

      await expect(userResolver.me()).rejects.toThrow('Not authenticated')
    })
  })

  describe('user', () => {
    it('should return user by id when admin', async () => {
      const mockUser = createMockUser({ id: 'user-2' })
      const currentUser = createMockUser({ role: UserRole.Admin })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockUserService.getUserById.mockResolvedValue(mockUser)

      const result = await userResolver.user('user-2')

      expect(result).toEqual(mockUser)
      expect(mockUserService.checkPermission).toHaveBeenCalledWith(
        currentUser,
        UserRole.Admin
      )
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-2')
    })

    it('should throw error when not admin', async () => {
      const currentUser = createMockUser({ role: UserRole.Client })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(userResolver.user('user-2')).rejects.toThrow('Access denied')
    })
  })

  describe('users', () => {
    it('should return users list when admin', async () => {
      const mockUsers = [createMockUser(), createMockUser({ id: 'user-2' })]
      const currentUser = createMockUser({ role: UserRole.Admin })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockUserService.getUsers.mockResolvedValue(mockUsers)

      const result = await userResolver.users()

      expect(result).toEqual(mockUsers)
      expect(mockUserService.checkPermission).toHaveBeenCalledWith(
        currentUser,
        UserRole.Admin
      )
      expect(mockUserService.getUsers).toHaveBeenCalledWith(undefined)
    })

    it('should pass filter to getUsers', async () => {
      const mockUsers = [createMockUser()]
      const currentUser = createMockUser({ role: UserRole.Admin })
      const filter = { role: UserRole.Client }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockUserService.getUsers.mockResolvedValue(mockUsers)

      const result = await userResolver.users(filter)

      expect(result).toEqual(mockUsers)
      expect(mockUserService.getUsers).toHaveBeenCalledWith(filter)
    })
  })

  describe('myDashboard', () => {
    it('should return dashboard object with user id', async () => {
      const currentUser = createMockUser()
      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      const result = await userResolver.myDashboard()

      expect(result).toEqual({ userId: currentUser.id })
      expect(mockUserService.getCurrentUserWithAuth).toHaveBeenCalledOnce()
    })
  })

  describe('updateUser', () => {
    it('should allow user to update themselves', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const updatedUser = createMockUser({ id: 'user-1', firstName: 'Updated' })
      const input = { firstName: 'Updated' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockUserService.updateUser.mockResolvedValue(updatedUser)

      const result = await userResolver.updateUser('user-1', input)

      expect(result).toEqual(updatedUser)
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-1', input)
    })

    it('should allow admin to update any user', async () => {
      const currentUser = createMockUser({ role: UserRole.Admin })
      const updatedUser = createMockUser({ id: 'user-2', firstName: 'Updated' })
      const input = { firstName: 'Updated' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockUserService.updateUser.mockResolvedValue(updatedUser)

      const result = await userResolver.updateUser('user-2', input)

      expect(result).toEqual(updatedUser)
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-2', input)
    })

    it('should throw error when user tries to update another user', async () => {
      const currentUser = createMockUser({
        id: 'user-1',
        role: UserRole.Client,
      })
      const input = { firstName: 'Updated' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})

      await expect(userResolver.updateUser('user-2', input)).rejects.toThrow(
        GraphQLError
      )
    })

    it('should sanitize input for non-admin users', async () => {
      const currentUser = createMockUser({
        id: 'user-1',
        role: UserRole.Client,
      })
      const updatedUser = createMockUser({ id: 'user-1' })
      const input = { firstName: 'Updated' } // Only allowed fields

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockUserService.updateUser.mockResolvedValue(updatedUser)

      const result = await userResolver.updateUser('user-1', input)

      expect(result).toEqual(updatedUser)
      // Should only include allowed fields
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-1', {
        firstName: 'Updated',
      })
    })

    it('should throw error when non-admin tries to update another user', async () => {
      const currentUser = createMockUser({
        id: 'user-1',
        role: UserRole.Client,
      })
      const input: UpdateUserInput = { firstName: 'Updated Name' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(userResolver.updateUser('user-2', input)).rejects.toThrow(
        'Access denied'
      )
    })
  })

  describe('Field Resolvers', () => {
    describe('createdAt', () => {
      it('should return ISO string for valid date', () => {
        const user = createMockUser({
          createdAt: new Date('2024-01-01T00:00:00Z'),
        })

        const result = userResolver.createdAt(user as any)

        expect(result).toBe('2024-01-01T00:00:00.000Z')
      })

      it('should return null for invalid date', () => {
        const user = createMockUser({ createdAt: 'invalid-date' })

        const result = userResolver.createdAt(user as any)

        expect(result).toBeNull()
      })

      it('should return null for null createdAt', () => {
        const user = createMockUser({ createdAt: null })

        const result = userResolver.createdAt(user as any)

        expect(result).toBeNull()
      })
    })

    describe('updatedAt', () => {
      it('should return ISO string for valid date', () => {
        const user = createMockUser({
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        })

        const result = userResolver.updatedAt(user as any)

        expect(result).toBe('2024-01-01T00:00:00.000Z')
      })

      it('should return null for invalid date', () => {
        const user = createMockUser({ updatedAt: 'invalid-date' })

        const result = userResolver.updatedAt(user as any)

        expect(result).toBeNull()
      })
    })

    describe('skills', () => {
      it('should return array for valid JSON string', () => {
        const user = createMockUser({ skills: '["JavaScript", "TypeScript"]' })

        const result = userResolver.skills(user as any)

        expect(result).toEqual(['JavaScript', 'TypeScript'])
      })

      it('should return array for already parsed array', () => {
        const user = createMockUser({ skills: ['JavaScript', 'TypeScript'] })

        const result = userResolver.skills(user as any)

        expect(result).toEqual(['JavaScript', 'TypeScript'])
      })

      it('should return null for invalid JSON', () => {
        const user = createMockUser({ skills: 'invalid-json' })

        const result = userResolver.skills(user as any)

        expect(result).toBeNull()
      })

      it('should return null for null skills', () => {
        const user = createMockUser({ skills: null })

        const result = userResolver.skills(user as any)

        expect(result).toBeNull()
      })
    })

    describe('hourlyRate', () => {
      it('should return string for valid number', () => {
        const user = createMockUser({ hourlyRate: 50 })

        const result = userResolver.hourlyRate(user as any)

        expect(result).toBe('50')
      })

      it('should return null for null hourlyRate', () => {
        const user = createMockUser({ hourlyRate: null })

        const result = userResolver.hourlyRate(user as any)

        expect(result).toBeNull()
      })

      it('should return null for undefined hourlyRate', () => {
        const user = createMockUser({ hourlyRate: undefined })

        const result = userResolver.hourlyRate(user as any)

        expect(result).toBeNull()
      })
    })
  })
})
