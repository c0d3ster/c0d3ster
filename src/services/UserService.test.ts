import { auth } from '@clerk/nextjs/server'
import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserRole } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { isAdminRole, isDeveloperOrHigherRole } from '@/utils'

import { UserService } from './UserService'

// Mock specific dependencies not covered by global setup
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/utils', () => ({
  isAdminRole: vi.fn(),
  isDeveloperOrHigherRole: vi.fn(),
}))

describe('UserService', () => {
  let userService: UserService
  const mockAuth = vi.mocked(auth)
  const mockDbQueryUsers = vi.mocked(db.query.users)
  const mockDbQueryProjects = vi.mocked(db.query.projects)
  const mockDbQueryProjectRequests = vi.mocked(db.query.projectRequests)
  const mockDbUpdate = vi.mocked(db.update)
  const mockDbSelect = vi.mocked(db.select)
  const mockIsAdminRole = vi.mocked(isAdminRole)
  const mockIsDeveloperOrHigherRole = vi.mocked(isDeveloperOrHigherRole)

  const mockUser = {
    id: '1',
    clerkId: 'clerk_123',
    email: 'test@example.com',
    role: UserRole.Admin,
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    userService = new UserService()
  })

  describe('getCurrentUserWithAuth', () => {
    it('should return user when authenticated and found', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any)
      mockDbQueryUsers.findFirst.mockResolvedValue(mockUser)

      const result = await userService.getCurrentUserWithAuth()

      expect(mockAuth).toHaveBeenCalled()
      expect(mockDbQueryUsers.findFirst).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should throw UNAUTHORIZED error when no userId', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any)

      await expect(userService.getCurrentUserWithAuth()).rejects.toThrow(
        GraphQLError
      )
    })

    it('should throw USER_NOT_FOUND error when user not found', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any)
      mockDbQueryUsers.findFirst.mockResolvedValue(null as any)

      await expect(userService.getCurrentUserWithAuth()).rejects.toThrow(
        GraphQLError
      )
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when found', async () => {
      mockDbQueryUsers.findFirst.mockResolvedValue(mockUser)

      const result = await userService.getCurrentUser('clerk_123')

      expect(mockDbQueryUsers.findFirst).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should throw error when user not found', async () => {
      mockDbQueryUsers.findFirst.mockResolvedValue(null as any)

      await expect(userService.getCurrentUser('clerk_123')).rejects.toThrow(
        'User not found'
      )
    })
  })

  describe('checkPermission', () => {
    it('should throw error for null user', () => {
      expect(() => {
        userService.checkPermission(null as any, 'ADMIN')
      }).toThrow(GraphQLError)
    })

    it('should throw error for user with empty role', () => {
      const userWithEmptyRole = { ...mockUser, role: '' }

      expect(() => {
        userService.checkPermission(userWithEmptyRole, 'ADMIN')
      }).toThrow(GraphQLError)
    })

    it('should check admin permissions correctly', () => {
      mockIsAdminRole.mockReturnValue(true)

      expect(() => {
        userService.checkPermission(mockUser, UserRole.Admin)
      }).not.toThrow()

      expect(mockIsAdminRole).toHaveBeenCalledWith(UserRole.Admin)
    })

    it('should throw error for invalid admin role', () => {
      mockIsAdminRole.mockReturnValue(false)

      expect(() => {
        userService.checkPermission(mockUser, UserRole.Admin)
      }).toThrow(GraphQLError)
    })

    it('should check developer permissions correctly', () => {
      mockIsDeveloperOrHigherRole.mockReturnValue(true)

      expect(() => {
        userService.checkPermission(mockUser, UserRole.Developer)
      }).not.toThrow()

      expect(mockIsDeveloperOrHigherRole).toHaveBeenCalledWith(UserRole.Admin)
    })

    it('should throw error for invalid developer role', () => {
      mockIsDeveloperOrHigherRole.mockReturnValue(false)

      expect(() => {
        userService.checkPermission(mockUser, UserRole.Developer)
      }).toThrow(GraphQLError)
    })
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockDbQueryUsers.findFirst.mockResolvedValue(mockUser)

      const result = await userService.getUserById('1')

      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found', async () => {
      mockDbQueryUsers.findFirst.mockResolvedValue(null as any)

      const result = await userService.getUserById('1')

      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      mockDbQueryUsers.findFirst.mockResolvedValue(mockUser)

      const result = await userService.getUserByEmail('test@example.com')

      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found', async () => {
      mockDbQueryUsers.findFirst.mockResolvedValue(null as any)

      const result = await userService.getUserByEmail('test@example.com')

      expect(result).toBeNull()
    })
  })

  describe('getUsers', () => {
    it('should return users without filter', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: '2' }]
      mockDbQueryUsers.findMany.mockResolvedValue(mockUsers)

      const result = await userService.getUsers()

      expect(result).toEqual(mockUsers)
    })

    it('should return users with role filter', async () => {
      const mockUsers = [mockUser]
      mockDbQueryUsers.findMany.mockResolvedValue(mockUsers)

      const result = await userService.getUsers({ role: UserRole.Admin })

      expect(result).toEqual(mockUsers)
    })

    it('should return users with email filter', async () => {
      const mockUsers = [mockUser]
      mockDbQueryUsers.findMany.mockResolvedValue(mockUsers)

      const result = await userService.getUsers({ email: 'test@example.com' })

      expect(result).toEqual(mockUsers)
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateInput = {
        firstName: 'Updated',
        lastName: 'User',
        role: UserRole.Developer,
      }
      const updatedUser = { ...mockUser, ...updateInput }

      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      } as any)

      const result = await userService.updateUser('1', updateInput)

      expect(result).toEqual(updatedUser)
    })

    it('should throw error when user not found', async () => {
      const updateInput = { firstName: 'Updated' }

      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

      await expect(userService.updateUser('1', updateInput)).rejects.toThrow(
        'User not found'
      )
    })
  })

  describe('getUserProjects', () => {
    it('should return user projects', async () => {
      const mockProjects = [
        {
          id: '1',
          clientId: '1',
          developerId: null,
          createdAt: new Date(),
        } as any,
      ]

      mockDbQueryProjects.findMany.mockResolvedValue(mockProjects)
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any)

      const result = await userService.getUserProjects('1')

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getUserProjectRequests', () => {
    it('should return user project requests', async () => {
      const mockRequests = [
        { id: '1', userId: '1', projectName: 'Test Project' } as any,
      ]
      mockDbQueryProjectRequests.findMany.mockResolvedValue(mockRequests)

      const result = await userService.getUserProjectRequests('1')

      expect(result).toEqual(mockRequests)
    })
  })
})
