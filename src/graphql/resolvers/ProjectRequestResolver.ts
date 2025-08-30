import { logger } from '@/libs/Logger'
import { ProjectRequestService, UserService } from '@/services'

const projectRequestService = new ProjectRequestService()
const userService = new UserService()

export const projectRequestResolvers = {
  Query: {
    projectRequests: async (_: any, { filter }: { filter?: any }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'admin')

      const results = await projectRequestService.getProjectRequests(filter)
      return results
    },

    projectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await userService.getCurrentUserWithAuth()

      return await projectRequestService.getProjectRequestById(
        id,
        currentUser.id,
        currentUser.role
      )
    },
  },

  Mutation: {
    createProjectRequest: async (_: any, { input }: { input: any }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'client')

      return await projectRequestService.createProjectRequest(
        input,
        currentUser.id
      )
    },

    updateProjectRequest: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await userService.getCurrentUserWithAuth()

      return await projectRequestService.updateProjectRequest(
        id,
        input,
        currentUser.id,
        currentUser.role
      )
    },

    approveProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'admin')

      return await projectRequestService.approveProjectRequest(id)
    },

    rejectProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'admin')

      return await projectRequestService.rejectProjectRequest(id)
    },
  },

  ProjectRequest: {
    user: async (parent: any) => {
      return await userService.getUserById(parent.userId)
    },

    reviewer: async (parent: any) => {
      if (!parent.reviewedBy) return null
      return await userService.getUserById(parent.reviewedBy)
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
        return new Date(parent.updatedAt).toISOString()
      } catch (error) {
        logger.error('Error formatting updatedAt', {
          error: String(error),
          value: parent.updatedAt,
        })
        return null
      }
    },

    status: (parent: any) => {
      return parent.status || 'unknown'
    },
  },

  ProjectRequestDisplay: {
    user: async (parent: any) => {
      const user = await userService.getUserById(parent.userId)

      if (!user) {
        logger.error('User not found for project request', {
          projectRequestId: parent.id,
          userId: parent.userId,
        })
        throw new Error(`User not found for project request ${parent.id}`)
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
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

    status: (parent: any) => {
      return parent.status || 'unknown'
    },
  },
}
