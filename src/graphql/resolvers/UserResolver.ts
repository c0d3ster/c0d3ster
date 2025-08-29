import { GraphQLError } from 'graphql'

import { logger } from '@/libs/Logger'
import { ProjectRequestService, ProjectService, UserService } from '@/services'
import { isDeveloperOrHigherRole } from '@/utils'

const userService = new UserService()
const projectService = new ProjectService()
const projectRequestService = new ProjectRequestService()

export const userResolvers = {
  Query: {
    me: async () => {
      const currentUser = await userService.getCurrentUserWithAuth()
      return currentUser
    },

    user: async (_: any, { id }: { id: string }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'admin')

      return await userService.getUserById(id)
    },

    users: async (_: any, { filter }: { filter?: any }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'admin')

      return await userService.getUsers(filter)
    },

    myDashboard: async () => {
      const currentUser = await userService.getCurrentUserWithAuth()
      // Return a placeholder object - the actual data will be resolved by field resolvers
      return { userId: currentUser.id }
    },
  },

  Mutation: {
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: Record<string, unknown> }
    ) => {
      const currentUser = await userService.getCurrentUserWithAuth()

      // Users can only update themselves, or admins can update anyone
      if (currentUser.id !== id && currentUser.role !== 'admin') {
        throw new GraphQLError('Access denied', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const isAdmin = currentUser.role === 'admin'
      const ALLOWED_SELF_UPDATE_FIELDS = [
        'firstName',
        'lastName',
        'avatarUrl',
        'bio',
        'timezone',
      ] as const
      const PRIVILEGED_FIELDS = ['role', 'emailVerified', 'status'] as const

      const sanitizedInput = Object.fromEntries(
        Object.entries(input).filter(([key]) =>
          isAdmin ? true : ALLOWED_SELF_UPDATE_FIELDS.includes(key as any)
        )
      )

      // Extra guard: prevent privileged fields from slipping through for non-admins
      if (
        !isAdmin &&
        Object.keys(input).some((k) => PRIVILEGED_FIELDS.includes(k as any))
      ) {
        throw new GraphQLError('Cannot modify restricted fields', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return await userService.updateUser(id, sanitizedInput)
    },
  },

  User: {
    // Ensure date fields are properly formatted as strings
    createdAt: (parent: any) => {
      if (!parent.createdAt) return null
      try {
        const date = new Date(parent.createdAt)
        if (Number.isNaN(date.getTime())) {
          logger.error('Invalid date value for createdAt', {
            value: parent.createdAt,
          })
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
          logger.error('Invalid date value for updatedAt', {
            value: parent.updatedAt,
          })
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
  },

  UserDashboard: {
    projects: async (_parent: any) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      return await projectService.getMyProjects(currentUser.id)
    },

    projectRequests: async (_parent: any) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      return await projectRequestService.getMyProjectRequests(
        currentUser.id,
        currentUser.role
      )
    },

    availableProjects: async (_parent: any) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      if (!isDeveloperOrHigherRole(currentUser.role)) {
        return []
      }
      return await projectService.getAvailableProjects()
    },

    assignedProjects: async (_parent: any) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      if (!isDeveloperOrHigherRole(currentUser.role)) {
        return []
      }
      return await projectService.getAssignedProjects(currentUser.id)
    },

    summary: async (_parent: any) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      const [projects, projectRequests] = await Promise.all([
        projectService.getMyProjects(currentUser.id),
        projectRequestService.getMyProjectRequests(
          currentUser.id,
          currentUser.role
        ),
      ])

      const totalProjects = projects.length
      const activeProjects = projects.filter(
        (p) => p.status === 'in_progress'
      ).length
      const completedProjects = projects.filter(
        (p) => p.status === 'completed'
      ).length
      const pendingRequests = projectRequests.filter(
        (r) => r.status === 'requested'
      ).length

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        pendingRequests,
      }
    },
  },
}
