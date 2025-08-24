import { GraphQLError } from 'graphql'

import { UserService } from '@/services'
import { checkPermission, getCurrentUser } from '@/utils'

const userService = new UserService()

export const userResolvers = {
  Query: {
    me: async () => {
      const currentUser = await getCurrentUser()
      console.error('🚨 GET ME QUERY - CURRENT USER:', {
        id: currentUser?.id,
        role: currentUser?.role,
        email: currentUser?.email,
      })
      return currentUser
    },

    user: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await userService.getUserById(id)
    },

    users: async (_: any, { filter }: { filter?: any }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await userService.getUsers(filter)
    },

    myDashboard: async () => {
      const currentUser = await getCurrentUser()
      // Return a placeholder object - the actual data will be resolved by field resolvers
      return { userId: currentUser.id }
    },
  },

  Mutation: {
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: Record<string, unknown> }
    ) => {
      const currentUser = await getCurrentUser()

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
    projects: async (parent: any) => {
      return await userService.getUserProjects(parent.id)
    },

    projectRequests: async (parent: any) => {
      return await userService.getUserProjectRequests(parent.id)
    },
  },

  UserDashboard: {
    projects: async (parent: any) => {
      return await userService.getUserProjects(parent.userId)
    },

    projectRequests: async (parent: any) => {
      return await userService.getUserProjectRequests(parent.userId)
    },

    summary: async (parent: any) => {
      const [projects, projectRequests] = await Promise.all([
        userService.getUserProjects(parent.userId),
        userService.getUserProjectRequests(parent.userId),
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
