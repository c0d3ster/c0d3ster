import { desc, eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'
import { ProjectService } from '@/services'
import { checkPermission, getCurrentUser } from '@/utils'

const projectService = new ProjectService()

export const projectResolvers = {
  Query: {
    projects: async (_: any, { filter }: { filter?: any }) => {
      const currentUser = await getCurrentUser()

      return await projectService.getProjects(
        filter,
        currentUser.id,
        currentUser.role
      )
    },

    project: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()

      return await projectService.getProjectById(
        id,
        currentUser.id,
        currentUser.role
      )
    },

    myProjects: async () => {
      const currentUser = await getCurrentUser()

      return await projectService.getMyProjects(currentUser.id)
    },

    availableProjects: async () => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'developer')

      return await projectService.getAvailableProjects()
    },

    assignedProjects: async () => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'developer')

      return await projectService.getAssignedProjects(currentUser.id)
    },
  },

  Mutation: {
    createProject: async (_: any, { input }: { input: any }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await projectService.createProject(input)
    },

    updateProject: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await getCurrentUser()

      return await projectService.updateProject(
        id,
        input,
        currentUser.id,
        currentUser.role
      )
    },

    assignProject: async (
      _: any,
      { projectId, developerId }: { projectId: string; developerId: string }
    ) => {
      const currentUser = await getCurrentUser()
      // Permission check is now handled in the service layer

      return await projectService.assignProject(
        projectId,
        developerId,
        currentUser.id,
        currentUser.role
      )
    },

    updateProjectStatus: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await getCurrentUser()

      return await projectService.updateProjectStatus(
        id,
        input,
        currentUser.id,
        currentUser.role
      )
    },
  },

  Project: {
    projectRequest: async (parent: any) => {
      if (!parent.requestId) return null
      return await db.query.projectRequests.findFirst({
        where: eq(schemas.projectRequests.id, parent.requestId),
      })
    },

    client: async (parent: any) => {
      return await db.query.users.findFirst({
        where: eq(schemas.users.id, parent.clientId),
      })
    },

    developer: async (parent: any) => {
      if (!parent.developerId) return null
      return await db.query.users.findFirst({
        where: eq(schemas.users.id, parent.developerId),
      })
    },

    statusUpdates: async (parent: any) => {
      return await db.query.projectStatusUpdates.findMany({
        where: eq(schemas.projectStatusUpdates.projectId, parent.id),
        orderBy: [desc(schemas.projectStatusUpdates.createdAt)],
      })
    },

    collaborators: async (parent: any) => {
      return await db.query.projectCollaborators.findMany({
        where: eq(schemas.projectCollaborators.projectId, parent.id),
      })
    },

    // Ensure date fields are properly formatted as strings
    createdAt: (parent: any) => {
      if (!parent.createdAt) {
        logger.warn('Project createdAt is null/undefined for project', {
          projectId: parent.id,
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

    startDate: (parent: any) => {
      if (!parent.startDate) return null
      try {
        return new Date(parent.startDate).toISOString()
      } catch (error) {
        logger.error('Error formatting startDate', {
          error: String(error),
          value: parent.startDate,
        })
        return null
      }
    },

    endDate: (parent: any) => {
      if (!parent.endDate) return null
      try {
        return new Date(parent.endDate).toISOString()
      } catch (error) {
        logger.error('Error formatting endDate', {
          error: String(error),
          value: parent.endDate,
        })
        return null
      }
    },

    // Debug status field
    status: (parent: any) => {
      logger.warn('Project status resolver', {
        parentStatus: parent.status,
        type: typeof parent.status,
      })
      return parent.status || 'unknown'
    },
  },
}
