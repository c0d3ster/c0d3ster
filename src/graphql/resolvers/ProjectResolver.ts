import type { MutationAssignProjectArgs } from '@/graphql/generated/graphql'
import type { FileService, ProjectService, UserService } from '@/services'

import { SUPPORT_EMAIL } from '@/constants'
import { logger } from '@/libs/Logger'

export class ProjectResolver {
  [key: string]: any

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private fileService: FileService
  ) {}

  Project = {
    // Ensure requestId is properly exposed
    requestId: (parent: any) => {
      return parent.requestId || null
    },

    client: async (parent: any) => {
      return await this.userService.getUserById(parent.clientId)
    },

    developer: async (parent: any) => {
      if (!parent.developerId) return null
      return await this.userService.getUserById(parent.developerId)
    },

    projectRequest: async (parent: any) => {
      if (!parent.projectRequestId) return null
      return await this.projectService.getProjectRequestById(
        parent.projectRequestId
      )
    },

    statusUpdates: async (parent: any) => {
      return await this.projectService.getProjectStatusUpdates(parent.id)
    },

    collaborators: async (parent: any) => {
      return await this.projectService.getProjectCollaborators(parent.id)
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
          return await this.fileService.generatePresignedDownloadUrl(
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
  }

  ProjectDisplay = {
    logo: async (parent: any) => {
      if (!parent.logo) return null

      // If it's a public asset path, return as-is
      if (parent.logo.startsWith('/assets/')) {
        return parent.logo
      }

      // If it's an R2 bucket path (contains projects/), generate presigned URL
      if (parent.logo.includes('projects/')) {
        try {
          return await this.fileService.generatePresignedDownloadUrl(
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
  }

  ProjectStatusUpdate = {
    updatedBy: async (parent: any) => {
      return await this.userService.getUserById(parent.updatedById)
    },
  }

  ProjectCollaborator = {
    user: async (parent: any) => {
      return await this.userService.getUserById(parent.userId)
    },
  }

  Query = {
    project: async (_: any, { id }: { id: string }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

      return await this.projectService.getProjectById(
        id,
        currentUser.role === 'admin' ? undefined : currentUser.id
      )
    },

    projectBySlug: async (_: any, { slug }: { slug: string }) => {
      // Allow public access to project details (no authentication required)
      return await this.projectService.getProjectBySlug(slug)
    },

    projects: async (
      _: any,
      { filter, userEmail }: { filter?: any; userEmail?: string }
    ) => {
      // Allow public access for SUPPORT_EMAIL without authentication
      if (userEmail === SUPPORT_EMAIL) {
        return await this.projectService.getProjects(filter)
      }

      // For other users, require authentication
      await this.userService.getCurrentUserWithAuth()

      if (userEmail) {
        const user = await this.userService.getUserByEmail(userEmail)
        if (user) {
          return await this.projectService.getProjects(filter, user.id)
        }
      }
      return await this.projectService.getProjects(filter)
    },

    featuredProjects: async (_: any, { userEmail }: { userEmail?: string }) => {
      // Allow public access for SUPPORT_EMAIL without authentication
      if (userEmail === SUPPORT_EMAIL) {
        return await this.projectService.getFeaturedProjects()
      }

      // For other users, require authentication
      await this.userService.getCurrentUserWithAuth()

      if (userEmail) {
        const user = await this.userService.getUserByEmail(userEmail)
        if (user) {
          return await this.projectService.getFeaturedProjects(user.id)
        }
      }
      return await this.projectService.getFeaturedProjects()
    },
  }

  Mutation = {
    createProject: async (_: any, { input }: { input: any }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      this.userService.checkPermission(currentUser, 'admin')

      return await this.projectService.createProject(input)
    },

    updateProject: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

      return await this.projectService.updateProject(
        id,
        input,
        currentUser.id,
        currentUser.role
      )
    },

    assignProject: async (
      _: any,
      { projectId, developerId }: MutationAssignProjectArgs
    ) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

      return await this.projectService.assignProject(
        projectId,
        developerId,
        currentUser.id, // developerId (self-assignment for now)
        currentUser.role // currentUserRole
      )
    },

    updateProjectStatus: async (
      _: any,
      { projectId, status }: { projectId: string; status: string }
    ) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

      return await this.projectService.updateProjectStatus(
        projectId,
        status,
        currentUser.id,
        currentUser.role
      )
    },
  }
}
