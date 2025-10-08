import { beforeEach, describe, expect, it } from 'vitest'

import { ProjectRequestResolver } from '@/graphql/resolvers/ProjectRequestResolver'
import { ProjectType, UserRole } from '@/graphql/schema'
import { createMockUser } from '@/tests/mocks/auth'
import { createMockProjectRequest } from '@/tests/mocks/projects'
import {
  createMockProjectRequestService,
  createMockUserService,
} from '@/tests/mocks/services'

describe('ProjectRequestResolver', () => {
  let projectRequestResolver: ProjectRequestResolver
  let mockUserService: ReturnType<typeof createMockUserService>
  let mockProjectRequestService: ReturnType<
    typeof createMockProjectRequestService
  >

  beforeEach(() => {
    mockUserService = createMockUserService()
    mockProjectRequestService = createMockProjectRequestService()
    projectRequestResolver = new ProjectRequestResolver(
      mockProjectRequestService as any,
      mockUserService as any
    )
  })

  describe('projectRequests', () => {
    it('should return project requests for authenticated user', async () => {
      const mockRequests = [createMockProjectRequest()]
      const currentUser = createMockUser({ id: 'user-1', role: 'client' })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectRequestService.getProjectRequests.mockResolvedValue(
        mockRequests
      )

      const result = await projectRequestResolver.projectRequests()

      expect(result).toEqual(mockRequests)
      expect(mockProjectRequestService.getProjectRequests).toHaveBeenCalledWith(
        undefined
      )
    })

    it('should throw error when not authenticated', async () => {
      mockUserService.getCurrentUserWithAuth.mockRejectedValue(
        new Error('Not authenticated')
      )

      await expect(projectRequestResolver.projectRequests()).rejects.toThrow(
        'Not authenticated'
      )
    })
  })

  describe('projectRequest', () => {
    it('should return project request by id', async () => {
      const mockRequest = createMockProjectRequest()
      const currentUser = createMockUser()

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectRequestService.getProjectRequestById.mockResolvedValue(
        mockRequest
      )

      const result = await projectRequestResolver.projectRequest('request-1')

      expect(result).toEqual(mockRequest)
      expect(
        mockProjectRequestService.getProjectRequestById
      ).toHaveBeenCalledWith('request-1', currentUser.id, currentUser.role)
    })
  })

  describe('createProjectRequest', () => {
    it('should create project request', async () => {
      const mockRequest = createMockProjectRequest()
      const currentUser = createMockUser()
      const input = {
        projectName: 'New Project Request',
        description: 'A new project request',
        projectType: ProjectType.WebApp,
        budget: 5000,
        requirements: 'Some requirements',
      }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectRequestService.createProjectRequest.mockResolvedValue(
        mockRequest
      )

      const result = await projectRequestResolver.createProjectRequest(input)

      expect(result).toEqual(mockRequest)
      expect(
        mockProjectRequestService.createProjectRequest
      ).toHaveBeenCalledWith(input, currentUser.id)
    })
  })

  describe('updateProjectRequest', () => {
    it('should update project request', async () => {
      const mockRequest = createMockProjectRequest()
      const currentUser = createMockUser()
      const input = {
        projectName: 'Updated Project',
        projectType: ProjectType.WebApp,
        description: 'Updated description',
      }

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockProjectRequestService.updateProjectRequest.mockResolvedValue(
        mockRequest
      )

      const result = await projectRequestResolver.updateProjectRequest(
        'request-1',
        input
      )

      expect(result).toEqual(mockRequest)
      expect(
        mockProjectRequestService.updateProjectRequest
      ).toHaveBeenCalledWith(
        'request-1',
        input,
        currentUser.id,
        currentUser.role
      )
    })
  })

  describe('approveProjectRequest', () => {
    it('should approve project request when admin', async () => {
      const mockRequest = createMockProjectRequest()
      const currentUser = createMockUser({ role: UserRole.Admin })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockProjectRequestService.approveProjectRequest.mockResolvedValue(
        mockRequest
      )

      const result =
        await projectRequestResolver.approveProjectRequest('request-1')

      expect(result).toEqual('1')
      expect(mockUserService.checkPermission).toHaveBeenCalledWith(
        currentUser,
        UserRole.Admin
      )
      expect(
        mockProjectRequestService.approveProjectRequest
      ).toHaveBeenCalledWith('request-1', currentUser.id, currentUser.role)
    })

    it('should throw error when not admin', async () => {
      const currentUser = createMockUser({ role: UserRole.Client })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(
        projectRequestResolver.approveProjectRequest('request-1')
      ).rejects.toThrow('Access denied')
    })
  })

  describe('rejectProjectRequest', () => {
    it('should reject project request when admin', async () => {
      const mockRequest = createMockProjectRequest()
      const currentUser = createMockUser({ role: UserRole.Admin })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {})
      mockProjectRequestService.rejectProjectRequest.mockResolvedValue(
        mockRequest
      )

      const result =
        await projectRequestResolver.rejectProjectRequest('request-1')

      expect(result).toEqual('1')
      expect(mockUserService.checkPermission).toHaveBeenCalledWith(
        currentUser,
        UserRole.Admin
      )
      expect(
        mockProjectRequestService.rejectProjectRequest
      ).toHaveBeenCalledWith('request-1', currentUser.id)
    })

    it('should throw error when not admin', async () => {
      const currentUser = createMockUser({ role: UserRole.Client })

      mockUserService.getCurrentUserWithAuth.mockResolvedValue(currentUser)
      mockUserService.checkPermission.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(
        projectRequestResolver.rejectProjectRequest('request-1')
      ).rejects.toThrow('Access denied')
    })
  })
})
