import { SUPPORT_EMAIL } from '@/constants'
import { logger } from '@/libs/Logger'
import { services } from '@/services'

const { projectService, userService } = services

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

    logo: async (parent: any) => {
      if (!parent.logo) return null

      // If it's a public asset path, return as-is
      if (parent.logo.startsWith('/assets/')) {
        return parent.logo
      }

      // If it's an R2 bucket path (contains projects/), generate presigned URL
      if (parent.logo.includes('projects/')) {
        try {
          return await services.fileService.generatePresignedDownloadUrl(
            parent.logo
          )
        } catch (error) {
          logger.error('Error generating presigned URL for logo', {
            error: String(error),
            logo: parent.logo,
          })
          return null
        }
      }

      // Fallback: return as-is (could be external URL or other path)
      return parent.logo
    },
  },

  ProjectDisplay: {
    logo: async (parent: any) => {
      if (!parent.logo) return null

      // If it's a public asset path, return as-is
      if (parent.logo.startsWith('/assets/')) {
        return parent.logo
      }

      // If it's an R2 bucket path (contains projects/), generate presigned URL
      if (parent.logo.includes('projects/')) {
        try {
          return await services.fileService.generatePresignedDownloadUrl(
            parent.logo
          )
        } catch (error) {
          logger.error('Error generating presigned URL for logo', {
            error: String(error),
            logo: parent.logo,
          })
          return null
        }
      }

      // Fallback: return as-is (could be external URL or other path)
      return parent.logo
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
    project: async (_: any, { id }: { id: string }) => {
      const currentUser = await userService.getCurrentUserWithAuth()

      return await projectService.getProjectById(
        id,
        currentUser.role === 'admin' ? undefined : currentUser.id
      )
    },

    projectBySlug: async (_: any, { slug }: { slug: string }) => {
      // Allow public access to project details (no authentication required)
      return await projectService.getProjectBySlug(slug)
    },

    projects: async (
      _: any,
      { filter, userEmail }: { filter?: any; userEmail?: string }
    ) => {
      // Allow public access for SUPPORT_EMAIL without authentication
      if (userEmail === SUPPORT_EMAIL) {
        return await projectService.getProjects(filter)
      }

      // For other users, require authentication
      await userService.getCurrentUserWithAuth()

      if (userEmail) {
        const user = await userService.getUserByEmail(userEmail)
        if (user) {
          return await projectService.getProjects(filter, user.id)
        }
      }
      return await projectService.getProjects(filter)
    },

    featuredProjects: async (_: any, { userEmail }: { userEmail?: string }) => {
      // Allow access for SUPPORT_EMAIL without authentication
      if (userEmail === SUPPORT_EMAIL) {
        return await projectService.getFeaturedProjects()
      }

      // For other users, require authentication
      await userService.getCurrentUserWithAuth()

      if (userEmail) {
        const user = await userService.getUserByEmail(userEmail)
        if (user) {
          return await projectService.getFeaturedProjects(user.id)
        }
      }
      return await projectService.getFeaturedProjects()
    },
  },

  Mutation: {
    createProject: async (_: any, { input }: { input: any }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'admin')

      return await projectService.createProject(input)
    },

    updateProject: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await userService.getCurrentUserWithAuth()

      return await projectService.updateProject(
        id,
        input,
        currentUser.role === 'admin' ? undefined : currentUser.id
      )
    },

    assignProject: async (
      _: any,
      { projectId, developerId }: { projectId: string; developerId: string }
    ) => {
      // Permission check is now handled in the service layer
      return await projectService.assignProject(projectId, developerId)
    },

    updateProjectStatus: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await userService.getCurrentUserWithAuth()

      return await projectService.updateProjectStatus(
        id,
        input,
        currentUser.role === 'admin' ? undefined : currentUser.id
      )
    },
  },
}
