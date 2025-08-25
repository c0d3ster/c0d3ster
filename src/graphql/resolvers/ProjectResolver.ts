import { logger } from '@/libs/Logger'
import { checkPermission, getCurrentUser } from '@/serverUtils'
import { ProjectService, UserService } from '@/services'

const projectService = new ProjectService()
const userService = new UserService()

export const projectResolvers = {
  Project: {
    // Ensure requestId is properly exposed
    requestId: (parent: any) => {
      return parent.requestId || null
    },

    client: async (parent: any) => {
      return await userService.getUserById(parent.clientId)
    },

    developer: async (parent: any) => {
      if (!parent.developerId) return null
      return await userService.getUserById(parent.developerId)
    },

    projectRequest: async (parent: any) => {
      if (!parent.projectRequestId) return null
      return await projectService.getProjectRequestById(parent.projectRequestId)
    },

    statusUpdates: async (parent: any) => {
      return await projectService.getProjectStatusUpdates(parent.id)
    },

    collaborators: async (parent: any) => {
      return await projectService.getProjectCollaborators(parent.id)
    },

    // Ensure date fields are properly formatted as strings
    createdAt: (parent: any) => {
      if (!parent.createdAt) return null
      try {
        return new Date(parent.createdAt).toISOString()
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

    estimatedCompletionDate: (parent: any) => {
      if (!parent.estimatedCompletionDate) return null
      try {
        return new Date(parent.estimatedCompletionDate).toISOString()
      } catch (error) {
        logger.error('Error formatting estimatedCompletionDate', {
          error: String(error),
          value: parent.estimatedCompletionDate,
        })
        return null
      }
    },

    actualCompletionDate: (parent: any) => {
      if (!parent.actualCompletionDate) return null
      try {
        return new Date(parent.actualCompletionDate).toISOString()
      } catch (error) {
        logger.error('Error formatting actualCompletionDate', {
          error: String(error),
          value: parent.actualCompletionDate,
        })
        return null
      }
    },
  },

  ProjectStatusUpdate: {
    updatedBy: async (parent: any) => {
      return await userService.getUserById(parent.updatedById)
    },
  },

  ProjectCollaborator: {
    user: async (parent: any) => {
      return await userService.getUserById(parent.userId)
    },
  },

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
}
