import type { SQL } from 'drizzle-orm'

import { auth } from '@clerk/nextjs/server'
import { and, desc, eq, ne } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'
import { isAdminRole, isDeveloperOrHigherRole } from '@/utils'

export class UserService {
  async getCurrentUserWithAuth() {
    const { userId } = await auth()
    if (!userId) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHORIZED' },
      })
    }

    const user = await db.query.users.findFirst({
      where: eq(schemas.users.clerkId, userId),
    })

    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'USER_NOT_FOUND' },
      })
    }

    return user
  }

  async getCurrentUser(clerkId: string) {
    const user = await db.query.users.findFirst({
      where: eq(schemas.users.clerkId, clerkId),
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  checkPermission(user: any, requiredRole: string) {
    if (!user || typeof user.role !== 'string' || user.role.length === 0) {
      throw new GraphQLError('Forbidden', {
        extensions: { code: 'FORBIDDEN', reason: 'MISSING_OR_INVALID_ROLE' },
      })
    }
    const userRole = user.role

    if (requiredRole === 'admin') {
      if (!isAdminRole(userRole)) {
        throw new GraphQLError('Admin permissions required', {
          extensions: { code: 'FORBIDDEN' },
        })
      }
    } else if (requiredRole === 'developer') {
      if (!isDeveloperOrHigherRole(userRole)) {
        throw new GraphQLError('Developer permissions required', {
          extensions: { code: 'FORBIDDEN' },
        })
      }
    } else {
      // For specific role checks (client, etc.)
      // Allow users with higher roles to access lower role permissions
      if (userRole !== requiredRole && !isAdminRole(userRole)) {
        // Check if user has a higher role than required
        const roleHierarchy = ['client', 'developer', 'admin', 'super_admin']
        const userRoleIndex = roleHierarchy.indexOf(userRole)
        const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)

        if (userRoleIndex < requiredRoleIndex) {
          throw new GraphQLError(`${requiredRole} permissions required`, {
            extensions: { code: 'FORBIDDEN' },
          })
        }
      }
    }
  }

  async getUserById(id: string) {
    return await db.query.users.findFirst({
      where: eq(schemas.users.id, id),
    })
  }

  async getUsers(filter?: { role?: string; email?: string }) {
    let whereClause: SQL | undefined
    if (filter) {
      const conditions: SQL[] = []
      if (filter.role) {
        conditions.push(eq(schemas.users.role, filter.role as any))
      }
      if (filter.email) {
        conditions.push(eq(schemas.users.email, filter.email))
      }
      if (conditions.length > 0) {
        whereClause =
          conditions.length === 1 ? conditions[0] : and(...conditions)
      }
    }

    return await db.query.users.findMany({
      where: whereClause,
      orderBy: [desc(schemas.users.createdAt)],
    })
  }

  async updateUser(id: string, input: any) {
    // Whitelist fields
    const {
      firstName,
      lastName,
      role,
      email,
      avatarUrl,
      bio,
      skills,
      portfolio,
      hourlyRate,
      availability,
    } = input
    const updatePayload = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(role !== undefined && { role }),
      ...(email !== undefined && { email }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(bio !== undefined && { bio }),
      ...(skills !== undefined && { skills }),
      ...(portfolio !== undefined && { portfolio }),
      ...(hourlyRate !== undefined && { hourlyRate }),
      ...(availability !== undefined && { availability }),
      updatedAt: new Date(),
    }

    const [updatedUser] = await db
      .update(schemas.users)
      .set(updatePayload)
      .where(eq(schemas.users.id, id))
      .returning()

    if (!updatedUser) {
      logger.warn(`User update failed (not found): ${id}`)
      throw new Error('User not found')
    }

    logger.info(`User updated: ${id}`)
    return updatedUser
  }

  // TODO: This method is currently unused but will be needed for user profiles
  // It returns projects where the user is the client (owner) or a collaborator
  async getUserProjects(userId: string) {
    // Get client projects (where user owns the project)
    const clientProjects = await db.query.projects.findMany({
      where: eq(schemas.projects.clientId, userId),
      orderBy: [desc(schemas.projects.createdAt)],
    })

    // Get collaborator projects (where user is a collaborator but NOT the main developer)
    const collaboratorProjects = await db
      .select()
      .from(schemas.projects)
      .innerJoin(
        schemas.projectCollaborators,
        eq(schemas.projects.id, schemas.projectCollaborators.projectId)
      )
      .where(
        and(
          eq(schemas.projectCollaborators.userId, userId),
          // Exclude projects where user is the main developer (those go in assigned projects)
          ne(schemas.projects.developerId, userId)
        )
      )
      .orderBy(desc(schemas.projects.createdAt))

    // Combine and deduplicate (in case user is both client and collaborator)
    const allProjects = [
      ...clientProjects.map((project) => ({
        ...project,
        userRole: 'client' as const,
      })),
      ...collaboratorProjects.map((item) => ({
        ...item.projects,
        userRole: 'collaborator' as const,
      })),
    ]

    // Remove duplicates by ID, prioritizing client role over collaborator
    const uniqueProjects = allProjects.reduce((acc, project) => {
      const existingIndex = acc.findIndex((p) => p.id === project.id)
      if (existingIndex === -1) {
        acc.push(project)
      } else if (
        project.userRole === 'client' &&
        acc[existingIndex].userRole === 'collaborator'
      ) {
        // Replace collaborator with client if user is both
        acc[existingIndex] = project
      }
      return acc
    }, [] as any[])

    return uniqueProjects.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async getUserProjectRequests(userId: string) {
    return await db.query.projectRequests.findMany({
      where: eq(schemas.projectRequests.userId, userId),
    })
  }
}
