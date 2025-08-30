import { GraphQLError } from 'graphql'

import type {
  ProjectRequestService,
  ProjectService,
  UserService,
} from '@/services'

import { logger } from '@/libs/Logger'

export class UserResolver {
  [key: string]: any

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private projectRequestService: ProjectRequestService
  ) {}

  Query = {
    me: async () => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      return currentUser
    },

    user: async (_: any, { id }: { id: string }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      this.userService.checkPermission(currentUser, 'admin')

      return await this.userService.getUserById(id)
    },

    users: async (_: any, { filter }: { filter?: any }) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      this.userService.checkPermission(currentUser, 'admin')

      return await this.userService.getUsers(filter)
    },

    myDashboard: async () => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      // Return a placeholder object - the actual data will be resolved by field resolvers
      return { userId: currentUser.id }
    },
  }

  Mutation = {
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: Record<string, unknown> }
    ) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

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

      return await this.userService.updateUser(id, sanitizedInput)
    },
  }

  User = {
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

    // Resolve user's projects
    projects: async (parent: any) => {
      return await this.projectService.getProjects(undefined, parent.id)
    },

    // Resolve user's project requests
    projectRequests: async (parent: any) => {
      return await this.projectRequestService.getProjectRequestsByUserId(
        parent.id
      )
    },

    // Resolve user's assigned projects (as developer)
    assignedProjects: async (parent: any) => {
      if (parent.role !== 'developer') return []
      return await this.projectService.getAssignedProjects(parent.id)
    },

    // Resolve user's available projects (as developer)
    availableProjects: async (parent: any) => {
      if (parent.role !== 'developer') return []
      return await this.projectService.getAvailableProjects()
    },

    // Resolve user's featured projects
    featuredProjects: async (parent: any) => {
      return await this.projectService.getFeaturedProjects(parent.id)
    },

    // Resolve user's public projects
    publicProjects: async (_parent: any) => {
      return await this.projectService.getPublicProjects()
    },

    // Resolve user's my projects
    myProjects: async (parent: any) => {
      return await this.projectService.getMyProjects(parent.id)
    },

    // Resolve user's role display
    roleDisplay: (parent: any) => {
      switch (parent.role) {
        case 'client':
          return 'Client'
        case 'developer':
          return 'Developer'
        case 'admin':
          return 'Admin'
        case 'super_admin':
          return 'Super Admin'
        default:
          return 'Unknown'
      }
    },

    // Resolve user's full name
    fullName: (parent: any) => {
      if (parent.firstName && parent.lastName) {
        return `${parent.firstName} ${parent.lastName}`
      }
      if (parent.firstName) return parent.firstName
      if (parent.lastName) return parent.lastName
      return 'Unknown User'
    },

    // Resolve user's initials
    initials: (parent: any) => {
      if (parent.firstName && parent.lastName) {
        return `${parent.firstName[0]}${parent.lastName[0]}`.toUpperCase()
      }
      if (parent.firstName) return parent.firstName[0].toUpperCase()
      if (parent.lastName) return parent.lastName[0].toUpperCase()
      return 'U'
    },
  }

  Dashboard = {
    // Resolve dashboard user
    user: async (parent: any) => {
      return await this.userService.getUserById(parent.userId)
    },

    // Resolve dashboard projects
    projects: async (parent: any) => {
      const user = await this.userService.getUserById(parent.userId)
      if (!user) return []

      if (user.role === 'client') {
        return await this.projectService.getMyProjects(user.id)
      } else if (user.role === 'developer') {
        return await this.projectService.getAssignedProjects(user.id)
      }

      return []
    },

    // Resolve dashboard project requests
    projectRequests: async (parent: any) => {
      const user = await this.userService.getUserById(parent.userId)
      if (!user) return []

      if (user.role === 'client') {
        return await this.projectRequestService.getProjectRequestsByUserId(
          user.id
        )
      }

      return []
    },

    // Resolve dashboard available projects (for developers)
    availableProjects: async (parent: any) => {
      const user = await this.userService.getUserById(parent.userId)
      if (!user || user.role !== 'developer') return []

      return await this.projectService.getAvailableProjects()
    },
  }
}
