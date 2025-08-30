import type { ProjectRequestService, UserService } from '@/services'

import { logger } from '@/libs/Logger'

export class ProjectRequestResolver {
  [key: string]: any

  constructor(
    private projectRequestService: ProjectRequestService,
    private userService: UserService
  ) {}

  Query = {
    projectRequests: async (_: any, { filter }: { filter?: any }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      this.userService.checkPermission(currentUser, 'admin')

      const results =
        await this.projectRequestService.getProjectRequests(filter)
      return results
    },

    projectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

      return await this.projectRequestService.getProjectRequestById(
        id,
        currentUser.id,
        currentUser.role
      )
    },
  }

  Mutation = {
    createProjectRequest: async (_: any, { input }: { input: any }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      this.userService.checkPermission(currentUser, 'client')

      return await this.projectRequestService.createProjectRequest(
        input,
        currentUser.id
      )
    },

    updateProjectRequest: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

      return await this.projectRequestService.updateProjectRequest(
        id,
        input,
        currentUser.id,
        currentUser.role
      )
    },

    approveProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      this.userService.checkPermission(currentUser, 'admin')

      return await this.projectRequestService.approveProjectRequest(id)
    },

    rejectProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      this.userService.checkPermission(currentUser, 'admin')

      return await this.projectRequestService.rejectProjectRequest(id)
    },
  }

  ProjectRequest = {
    user: async (parent: any) => {
      return await this.userService.getUserById(parent.userId)
    },

    reviewer: async (parent: any) => {
      if (!parent.reviewedBy) return null
      return await this.userService.getUserById(parent.reviewedBy)
    },

    // Ensure date fields are properly formatted as strings
    createdAt: (parent: any) => {
      if (!parent.createdAt) {
        return null
      }
      try {
        const date = new Date(parent.createdAt)
        if (Number.isNaN(date.getTime())) {
          logger.error('Invalid date value', { value: parent.createdAt })
          return null
        }
        return date.toISOString()
      } catch (error) {
        logger.error('Error formatting createdAt', {
          error: String(error),
          value: parent.createdAt,
        })
        return null
      }
    },

    updatedAt: (parent: any) => {
      if (!parent.updatedAt) return null
      try {
        const date = new Date(parent.updatedAt)
        if (Number.isNaN(date.getTime())) {
          logger.error('Invalid date value', { value: parent.updatedAt })
          return null
        }
        return date.toISOString()
      } catch (error) {
        logger.error('Error formatting updatedAt', {
          error: String(error),
          value: parent.updatedAt,
        })
        return null
      }
    },

    reviewedAt: (parent: any) => {
      if (!parent.reviewedAt) return null
      try {
        const date = new Date(parent.reviewedAt)
        if (Number.isNaN(date.getTime())) {
          logger.error('Invalid date value', { value: parent.reviewedAt })
          return null
        }
        return date.toISOString()
      } catch (error) {
        logger.error('Error formatting reviewedAt', {
          error: String(error),
          value: parent.reviewedAt,
        })
        return null
      }
    },
  }
}
