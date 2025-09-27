import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectStatus } from '@/graphql/generated/graphql'
import { DashboardResolver } from '@/graphql/resolvers/DashboardResolver'
import { createMockUser } from '@/tests/mocks/auth'
import {
  createMockProject,
  createMockProjectRequest,
} from '@/tests/mocks/projects'
import {
  createMockProjectRequestService,
  createMockProjectService,
  createMockUserService,
} from '@/tests/mocks/services'

// Mock utils
vi.mock('@/utils', () => ({
  isAdminRole: vi.fn(),
  isDeveloperOrHigherRole: vi.fn(),
  findProjectBySlug: vi.fn(),
  hasSlugConflict: vi.fn(),
  formatProfileDate: (date: string) => new Date(date).toLocaleDateString(),
}))

describe('DashboardResolver', () => {
  let dashboardResolver: DashboardResolver
  let mockUserService: ReturnType<typeof createMockUserService>
  let mockProjectService: ReturnType<typeof createMockProjectService>
  let mockProjectRequestService: ReturnType<
    typeof createMockProjectRequestService
  >

  beforeEach(() => {
    mockUserService = createMockUserService()
    mockProjectService = createMockProjectService()
    mockProjectRequestService = createMockProjectRequestService()
    dashboardResolver = new DashboardResolver(
      mockUserService as any,
      mockProjectService as any,
      mockProjectRequestService as any
    )
  })

  describe('projects', () => {
    it('should return user projects when accessing own dashboard', async () => {
      const mockProjects = [createMockProject()]
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-1' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getMyProjects.mockResolvedValue(mockProjects)

      const result = await dashboardResolver.projects(dashboardParent)

      expect(result).toEqual(mockProjects)
      expect(mockProjectService.getMyProjects).toHaveBeenCalledWith(
        currentUser.id,
        currentUser.role
      )
    })

    it('should throw error when accessing another user dashboard', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-2' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      await expect(dashboardResolver.projects(dashboardParent)).rejects.toThrow(
        GraphQLError
      )
    })
  })

  describe('projectRequests', () => {
    it('should return user project requests when accessing own dashboard', async () => {
      const mockRequests = [createMockProjectRequest()]
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-1' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectRequestService.getMyProjectRequests.mockResolvedValue(
        mockRequests
      )

      const result = await dashboardResolver.projectRequests(dashboardParent)

      expect(result).toEqual(mockRequests)
      expect(
        mockProjectRequestService.getMyProjectRequests
      ).toHaveBeenCalledWith(currentUser.id, currentUser.role)
    })

    it('should throw error when accessing another user dashboard', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-2' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      await expect(
        dashboardResolver.projectRequests(dashboardParent)
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('summary', () => {
    it('should return project summary for own dashboard', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-1' }
      const mockProjects = [
        createMockProject({ status: ProjectStatus.InProgress }),
        createMockProject({ status: ProjectStatus.Completed }),
        createMockProject({ status: ProjectStatus.InTesting }),
      ]
      const mockRequests = [
        createMockProjectRequest({ status: ProjectStatus.Requested }),
        createMockProjectRequest({ status: ProjectStatus.InReview }),
      ]

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getMyProjects.mockResolvedValue(mockProjects)
      mockProjectRequestService.getMyProjectRequests.mockResolvedValue(
        mockRequests
      )

      const result = await dashboardResolver.summary(dashboardParent)

      expect(result).toEqual({
        totalProjects: 3,
        activeProjects: 2, // in_progress + in_testing
        completedProjects: 1,
        totalRequests: 2,
        pendingReviewRequests: 1, // requested
        inReviewRequests: 1, // in_review
      })
    })

    it('should throw error when accessing another user dashboard', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-2' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      await expect(dashboardResolver.summary(dashboardParent)).rejects.toThrow(
        GraphQLError
      )
    })
  })

  describe('availableProjects', () => {
    it('should return available projects for developer', async () => {
      const mockProjects = [createMockProject()]
      const currentUser = createMockUser({ id: 'user-1', role: 'developer' })
      const dashboardParent = { userId: 'user-1' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getAvailableProjects.mockResolvedValue(mockProjects)

      // Mock isDeveloperOrHigherRole to return true
      const { isDeveloperOrHigherRole } = await import('@/utils')
      vi.mocked(isDeveloperOrHigherRole).mockReturnValue(true)

      const result = await dashboardResolver.availableProjects(dashboardParent)

      expect(result).toEqual(mockProjects)
      expect(mockProjectService.getAvailableProjects).toHaveBeenCalled()
    })

    it('should return empty array for non-developer', async () => {
      const currentUser = createMockUser({ id: 'user-1', role: 'client' })
      const dashboardParent = { userId: 'user-1' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      // Mock isDeveloperOrHigherRole to return false
      const { isDeveloperOrHigherRole } = await import('@/utils')
      vi.mocked(isDeveloperOrHigherRole).mockReturnValue(false)

      const result = await dashboardResolver.availableProjects(dashboardParent)

      expect(result).toEqual([])
      expect(mockProjectService.getAvailableProjects).not.toHaveBeenCalled()
    })

    it('should throw error when accessing another user dashboard', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-2' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      await expect(
        dashboardResolver.availableProjects(dashboardParent)
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('assignedProjects', () => {
    it('should return assigned projects for developer', async () => {
      const mockProjects = [createMockProject()]
      const currentUser = createMockUser({ id: 'user-1', role: 'developer' })
      const dashboardParent = { userId: 'user-1' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectService.getAssignedProjects.mockResolvedValue(mockProjects)

      // Mock isDeveloperOrHigherRole to return true
      const { isDeveloperOrHigherRole } = await import('@/utils')
      vi.mocked(isDeveloperOrHigherRole).mockReturnValue(true)

      const result = await dashboardResolver.assignedProjects(dashboardParent)

      expect(result).toEqual(mockProjects)
      expect(mockProjectService.getAssignedProjects).toHaveBeenCalledWith(
        currentUser.id
      )
    })

    it('should return empty array for non-developer', async () => {
      const currentUser = createMockUser({ id: 'user-1', role: 'client' })
      const dashboardParent = { userId: 'user-1' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      // Mock isDeveloperOrHigherRole to return false
      const { isDeveloperOrHigherRole } = await import('@/utils')
      vi.mocked(isDeveloperOrHigherRole).mockReturnValue(false)

      const result = await dashboardResolver.assignedProjects(dashboardParent)

      expect(result).toEqual([])
      expect(mockProjectService.getAssignedProjects).not.toHaveBeenCalled()
    })

    it('should throw error when accessing another user dashboard', async () => {
      const currentUser = createMockUser({ id: 'user-1' })
      const dashboardParent = { userId: 'user-2' }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)

      await expect(
        dashboardResolver.assignedProjects(dashboardParent)
      ).rejects.toThrow(GraphQLError)
    })
  })
})
