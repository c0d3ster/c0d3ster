import { beforeEach, describe, expect, it } from 'vitest'

import { StatusUpdateResolver } from '@/graphql/resolvers/StatusUpdateResolver'
import { createMockUser } from '@/tests/mocks/auth'
import { createMockUserService } from '@/tests/mocks/services'

// Mock data factory for status updates
const createMockStatusUpdate = (overrides = {}) => ({
  id: 'status-1',
  entityId: 'project-1',
  newStatus: 'in_progress',
  updateMessage: 'Project started',
  isClientVisible: true,
  updatedBy: 'user-1',
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

describe('StatusUpdateResolver', () => {
  let statusUpdateResolver: StatusUpdateResolver
  let mockUserService: ReturnType<typeof createMockUserService>

  beforeEach(() => {
    mockUserService = createMockUserService()
    statusUpdateResolver = new StatusUpdateResolver(mockUserService as any)
  })

  describe('Field Resolvers', () => {
    describe('updatedByUser', () => {
      it('should return user when updatedBy is present', async () => {
        const statusUpdate = createMockStatusUpdate({ updatedBy: 'user-1' })
        const user = createMockUser({ id: 'user-1' })

        mockUserService.getUserById.mockResolvedValue(user)

        const result = await statusUpdateResolver.updatedByUser(
          statusUpdate as any
        )

        expect(result).toEqual(user)
        expect(mockUserService.getUserById).toHaveBeenCalledWith('user-1')
      })

      it('should return null when updatedBy is not present', async () => {
        const statusUpdate = createMockStatusUpdate({ updatedBy: null })

        const result = await statusUpdateResolver.updatedByUser(
          statusUpdate as any
        )

        expect(result).toBeNull()
        expect(mockUserService.getUserById).not.toHaveBeenCalled()
      })

      it('should return null when user not found', async () => {
        const statusUpdate = createMockStatusUpdate({ updatedBy: 'user-1' })

        mockUserService.getUserById.mockResolvedValue(null)

        const result = await statusUpdateResolver.updatedByUser(
          statusUpdate as any
        )

        expect(result).toBeNull()
        expect(mockUserService.getUserById).toHaveBeenCalledWith('user-1')
      })

      it('should handle service errors gracefully', async () => {
        const statusUpdate = createMockStatusUpdate({ updatedBy: 'user-1' })

        mockUserService.getUserById.mockRejectedValue(
          new Error('Service error')
        )

        await expect(
          statusUpdateResolver.updatedByUser(statusUpdate as any)
        ).rejects.toThrow('Service error')
      })
    })
  })
})
