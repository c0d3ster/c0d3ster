import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectType } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { isAdminRole } from '@/utils'

import { ProjectRequestService } from './ProjectRequestService'

// Mock specific dependencies not covered by global setup
vi.mock('@/utils', () => ({
  isAdminRole: vi.fn(),
}))

describe('ProjectRequestService', () => {
  let projectRequestService: ProjectRequestService
  const mockDbQuery = vi.mocked(db.query.projectRequests)
  const mockDbQueryStatusUpdates = vi.mocked(db.query.statusUpdates)
  const mockDbInsert = vi.mocked(db.insert)
  const mockDbUpdate = vi.mocked(db.update)
  const mockDbTransaction = vi.mocked(db.transaction)
  const mockIsAdminRole = vi.mocked(isAdminRole)

  const mockProjectRequest = {
    id: 'request-123',
    userId: 'user-123',
    projectName: 'Test Project',
    title: 'Test Title',
    description: 'Test Description',
    projectType: ProjectType.WebApp,
    budget: 5000,
    timeline: '3 months',
    requirements: ['Feature 1', 'Feature 2'],
    contactPreference: 'EMAIL',
    additionalInfo: 'Additional info',
    status: 'requested',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
  }

  const mockCreateInput = {
    projectName: 'New Project',
    title: 'New Title',
    description: 'New Description',
    projectType: ProjectType.WebApp,
    budget: 3000,
    timeline: '2 months',
    requirements: 'Requirement 1',
    contactPreference: 'EMAIL',
    additionalInfo: 'Info',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    projectRequestService = new ProjectRequestService()
  })

  describe('getProjectRequests', () => {
    it('should return all project requests without filter', async () => {
      const mockRequests = [
        mockProjectRequest,
        { ...mockProjectRequest, id: 'request-456' },
      ]
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result = await projectRequestService.getProjectRequests()

      expect(mockDbQuery.findMany).toHaveBeenCalled()
      expect(result).toEqual(mockRequests)
    })

    it('should return filtered project requests by status', async () => {
      const mockRequests = [mockProjectRequest]
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result = await projectRequestService.getProjectRequests({
        status: 'requested',
      })

      expect(mockDbQuery.findMany).toHaveBeenCalled()
      expect(result).toEqual(mockRequests)
    })

    it('should return filtered project requests by project type', async () => {
      const mockRequests = [mockProjectRequest]
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result = await projectRequestService.getProjectRequests({
        projectType: ProjectType.WebApp,
      })

      expect(result).toEqual(mockRequests)
    })

    it('should return filtered project requests by userId', async () => {
      const mockRequests = [mockProjectRequest]
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result = await projectRequestService.getProjectRequests({
        userId: 'user-123',
      })

      expect(result).toEqual(mockRequests)
    })

    it('should return filtered project requests with multiple filters', async () => {
      const mockRequests = [mockProjectRequest]
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result = await projectRequestService.getProjectRequests({
        status: 'requested',
        projectType: ProjectType.WebApp,
        userId: 'user-123',
      })

      expect(result).toEqual(mockRequests)
    })
  })

  describe('getProjectRequestById', () => {
    it('should return project request when found and user has access', async () => {
      mockDbQuery.findFirst.mockResolvedValue(mockProjectRequest)

      const result = await projectRequestService.getProjectRequestById(
        'request-123',
        'user-123',
        'client'
      )

      expect(mockDbQuery.findFirst).toHaveBeenCalled()
      expect(result).toEqual(mockProjectRequest)
    })

    it('should throw error when project request not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectRequestService.getProjectRequestById(
          'request-123',
          'user-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw access denied error when user is not owner and not admin', async () => {
      const otherUserRequest = { ...mockProjectRequest, userId: 'other-user' }
      mockDbQuery.findFirst.mockResolvedValue(otherUserRequest)
      mockIsAdminRole.mockReturnValue(false)

      await expect(
        projectRequestService.getProjectRequestById(
          'request-123',
          'user-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should allow admin access to any project request', async () => {
      const otherUserRequest = { ...mockProjectRequest, userId: 'other-user' }
      mockDbQuery.findFirst.mockResolvedValue(otherUserRequest)
      mockIsAdminRole.mockReturnValue(true)

      const result = await projectRequestService.getProjectRequestById(
        'request-123',
        'user-123',
        'admin'
      )

      expect(result).toEqual(otherUserRequest)
    })
  })

  describe('getMyProjectRequests', () => {
    it('should return all project requests for admin', async () => {
      const mockRequests = [
        mockProjectRequest,
        { ...mockProjectRequest, id: 'request-456' },
      ]
      mockIsAdminRole.mockReturnValue(true)
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result = await projectRequestService.getMyProjectRequests(
        'user-123',
        'admin'
      )

      expect(result).toEqual(mockRequests)
    })

    it('should return only user project requests for non-admin', async () => {
      const mockRequests = [mockProjectRequest]
      mockIsAdminRole.mockReturnValue(false)
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result = await projectRequestService.getMyProjectRequests(
        'user-123',
        'client'
      )

      expect(mockDbQuery.findMany).toHaveBeenCalled()
      expect(result).toEqual(mockRequests)
    })
  })

  describe('getProjectRequestsByUserId', () => {
    it('should return project requests for specific user', async () => {
      const mockRequests = [mockProjectRequest]
      mockDbQuery.findMany.mockResolvedValue(mockRequests)

      const result =
        await projectRequestService.getProjectRequestsByUserId('user-123')

      expect(mockDbQuery.findMany).toHaveBeenCalled()
      expect(result).toEqual(mockRequests)
    })
  })

  describe('createProjectRequest', () => {
    it('should create project request successfully', async () => {
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProjectRequest]),
        }),
      } as any)

      const result = await projectRequestService.createProjectRequest(
        mockCreateInput,
        'user-123'
      )

      expect(mockDbInsert).toHaveBeenCalled()
      expect(result).toEqual(mockProjectRequest)
    })

    it('should throw error when creation fails', async () => {
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      } as any)

      await expect(
        projectRequestService.createProjectRequest(mockCreateInput, 'user-123')
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('updateProjectRequest', () => {
    it('should update project request successfully', async () => {
      const updatedRequest = { ...mockProjectRequest, title: 'Updated Title' }
      mockDbQuery.findFirst.mockResolvedValue(mockProjectRequest)
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRequest]),
          }),
        }),
      } as any)
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any)

      const result = await projectRequestService.updateProjectRequest(
        'request-123',
        { title: 'Updated Title' },
        'user-123',
        'client'
      )

      expect(mockDbUpdate).toHaveBeenCalled()
      expect(result).toEqual(updatedRequest)
    })

    it('should throw error when project request not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectRequestService.updateProjectRequest(
          'request-123',
          { title: 'Updated Title' },
          'user-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw access denied error when user is not owner and not admin', async () => {
      const otherUserRequest = { ...mockProjectRequest, userId: 'other-user' }
      mockDbQuery.findFirst.mockResolvedValue(otherUserRequest)
      mockIsAdminRole.mockReturnValue(false)

      await expect(
        projectRequestService.updateProjectRequest(
          'request-123',
          { title: 'Updated Title' },
          'user-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should prevent setting status to APPROVED directly', async () => {
      mockDbQuery.findFirst.mockResolvedValue(mockProjectRequest)

      await expect(
        projectRequestService.updateProjectRequest(
          'request-123',
          { status: 'approved' },
          'user-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should create status update when status is changed', async () => {
      const updatedRequest = { ...mockProjectRequest, status: 'in_review' }
      mockDbQuery.findFirst.mockResolvedValue(mockProjectRequest)
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRequest]),
          }),
        }),
      } as any)
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any)

      await projectRequestService.updateProjectRequest(
        'request-123',
        { status: 'in_review' },
        'user-123',
        'client'
      )

      expect(mockDbInsert).toHaveBeenCalledTimes(1) // For status update
    })
  })

  describe('approveProjectRequest', () => {
    it('should approve project request and create project', async () => {
      const inReviewRequest = { ...mockProjectRequest, status: 'in_review' }
      const mockProject = {
        id: 'project-123',
        clientId: 'user-123',
        requestId: 'request-123',
        projectName: 'Test Project',
      }

      mockDbQuery.findFirst.mockResolvedValue(inReviewRequest)
      mockIsAdminRole.mockReturnValue(true)

      mockDbTransaction.mockImplementation(async (callback) => {
        return callback({
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'request-123' }]),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockProject]),
            }),
          }),
        } as any)
      })

      const result = await projectRequestService.approveProjectRequest(
        'request-123',
        'admin-user',
        'admin'
      )

      expect(mockDbTransaction).toHaveBeenCalled()
      expect(result).toEqual(mockProject)
    })

    it('should throw access denied error for non-admin', async () => {
      mockIsAdminRole.mockReturnValue(false)

      await expect(
        projectRequestService.approveProjectRequest(
          'request-123',
          'user-123',
          'client'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when project request not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)
      mockIsAdminRole.mockReturnValue(true)

      await expect(
        projectRequestService.approveProjectRequest(
          'request-123',
          'admin-user',
          'admin'
        )
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when project request is not in review', async () => {
      mockDbQuery.findFirst.mockResolvedValue(mockProjectRequest) // status is PENDING
      mockIsAdminRole.mockReturnValue(true)

      await expect(
        projectRequestService.approveProjectRequest(
          'request-123',
          'admin-user',
          'admin'
        )
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('rejectProjectRequest', () => {
    it('should reject project request successfully', async () => {
      const rejectedRequest = { ...mockProjectRequest, status: 'CANCELLED' }
      mockDbQuery.findFirst.mockResolvedValue(mockProjectRequest)
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([rejectedRequest]),
          }),
        }),
      } as any)
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any)

      const result = await projectRequestService.rejectProjectRequest(
        'request-123',
        'admin-user'
      )

      expect(mockDbUpdate).toHaveBeenCalled()
      expect(mockDbInsert).toHaveBeenCalled() // For status update
      expect(result).toEqual(rejectedRequest)
    })

    it('should throw error when project request not found', async () => {
      mockDbQuery.findFirst.mockResolvedValue(undefined)

      await expect(
        projectRequestService.rejectProjectRequest('request-123', 'admin-user')
      ).rejects.toThrow(GraphQLError)
    })

    it('should throw error when rejection fails', async () => {
      mockDbQuery.findFirst.mockResolvedValue(mockProjectRequest)
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

      await expect(
        projectRequestService.rejectProjectRequest('request-123', 'admin-user')
      ).rejects.toThrow(GraphQLError)
    })
  })

  describe('getProjectRequestStatusUpdates', () => {
    it('should return all status updates for admin', async () => {
      const mockStatusUpdates = [
        {
          id: 'update-1',
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project_request',
          entityId: 'request-123',
          oldStatus: null,
          newStatus: 'in_review',
          updateMessage: 'Request moved to review',
          isClientVisible: true,
          updatedBy: 'admin-123',
        },
        {
          id: 'update-2',
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project_request',
          entityId: 'request-123',
          oldStatus: 'in_review',
          newStatus: 'approved',
          updateMessage: 'Request approved',
          isClientVisible: false,
          updatedBy: 'admin-123',
        },
      ]

      mockIsAdminRole.mockReturnValue(true)
      mockDbQueryStatusUpdates.findMany.mockResolvedValue(mockStatusUpdates)

      const result = await projectRequestService.getProjectRequestStatusUpdates(
        'request-123',
        'admin'
      )

      expect(mockDbQueryStatusUpdates.findMany).toHaveBeenCalled()
      expect(result).toEqual(mockStatusUpdates)
    })

    it('should return only client-visible status updates for non-admin', async () => {
      const mockStatusUpdates = [
        {
          id: 'update-1',
          createdAt: new Date(),
          progressPercentage: null,
          entityType: 'project_request',
          entityId: 'request-123',
          oldStatus: null,
          newStatus: 'in_review',
          updateMessage: 'Request moved to review',
          isClientVisible: true,
          updatedBy: 'admin-123',
        },
      ]

      mockIsAdminRole.mockReturnValue(false)
      mockDbQueryStatusUpdates.findMany.mockResolvedValue(mockStatusUpdates)

      const result = await projectRequestService.getProjectRequestStatusUpdates(
        'request-123',
        'client'
      )

      expect(result).toEqual(mockStatusUpdates)
    })
  })
})
