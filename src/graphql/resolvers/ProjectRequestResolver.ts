import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'
import { ProjectRequestService } from '@/services'
import { checkPermission, getCurrentUser } from '@/utils'

const projectRequestService = new ProjectRequestService()

export const projectRequestResolvers = {
  Query: {
    projectRequests: async (_: any, { filter }: { filter?: any }) => {
      console.error('🚨 PROJECT REQUESTS QUERY CALLED!!!', filter)
      try {
        const currentUser = await getCurrentUser()
        console.error('🚨 CURRENT USER:', currentUser)
        checkPermission(currentUser, 'admin')
        console.error('🚨 PERMISSION CHECK PASSED')

        const results = await projectRequestService.getProjectRequests(filter)
        console.error(
          '🚨 PROJECT REQUESTS QUERY RESULTS!!!',
          results.length,
          results[0]
        )
        return results
      } catch (error) {
        console.error('🚨 ERROR IN PROJECT REQUESTS QUERY:', error)
        throw error
      }
    },

    projectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()

      return await projectRequestService.getProjectRequestById(
        id,
        currentUser.id,
        currentUser.role
      )
    },

    myProjectRequests: async () => {
      const currentUser = await getCurrentUser()

      return await projectRequestService.getMyProjectRequests(
        currentUser.id,
        currentUser.role
      )
    },
  },

  Mutation: {
    createProjectRequest: async (_: any, { input }: { input: any }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'client')

      return await projectRequestService.createProjectRequest(
        input,
        currentUser.id
      )
    },

    updateProjectRequest: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await getCurrentUser()

      return await projectRequestService.updateProjectRequest(
        id,
        input,
        currentUser.id,
        currentUser.role
      )
    },

    approveProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await projectRequestService.approveProjectRequest(id)
    },

    rejectProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await projectRequestService.rejectProjectRequest(id)
    },
  },

  ProjectRequest: {
    user: async (parent: any) => {
      return await db.query.users.findFirst({
        where: eq(schemas.users.id, parent.userId),
      })
    },

    reviewer: async (parent: any) => {
      if (!parent.reviewedBy) return null
      return await db.query.users.findFirst({
        where: eq(schemas.users.id, parent.reviewedBy),
      })
    },

    // Ensure date fields are properly formatted as strings
    createdAt: (parent: any) => {
      logger.warn('ProjectRequest createdAt resolver', {
        parentCreatedAt: parent.createdAt,
        type: typeof parent.createdAt,
      })
      if (!parent.createdAt) {
        logger.warn('ProjectRequest createdAt is null/undefined for request', {
          requestId: parent.id,
        })
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

    // Debug status field
    status: (parent: any) => {
      logger.warn('ProjectRequest status resolver', {
        parentStatus: parent.status,
        type: typeof parent.status,
      })
      return parent.status || 'unknown'
    },
  },
}
