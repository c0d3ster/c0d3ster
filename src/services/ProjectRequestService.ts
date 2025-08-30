import { and, desc, eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'
import { isAdminRole, isUserRole } from '@/utils'

export class ProjectRequestService {
  async getProjectRequests(filter?: any) {
    let whereClause
    if (filter) {
      const conditions = []
      if (filter.status) {
        conditions.push(eq(schemas.projectRequests.status, filter.status))
      }
      if (filter.projectType) {
        conditions.push(
          eq(schemas.projectRequests.projectType, filter.projectType)
        )
      }
      if (filter.userId) {
        conditions.push(eq(schemas.projectRequests.userId, filter.userId))
      }
      if (conditions.length > 0) {
        whereClause =
          conditions.length === 1
            ? conditions[0]
            : conditions
                .slice(1)
                .reduce((acc, condition) => and(acc, condition), conditions[0])
      }
    }

    const results = await db.query.projectRequests.findMany({
      where: whereClause,
      orderBy: [desc(schemas.projectRequests.createdAt)],
    })

    return results
  }

  async getProjectRequestById(
    id: string,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const request = await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, id),
    })

    if (!request) {
      throw new GraphQLError('Project request not found', {
        extensions: { code: 'PROJECT_REQUEST_NOT_FOUND' },
      })
    }

    // Check access permissions - allow if it's your own request OR you're an admin/super_admin
    if (
      request.userId !== currentUserId &&
      !isAdminRole(isUserRole(currentUserRole) ? currentUserRole : null)
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return request
  }

  async getMyProjectRequests(currentUserId: string, _currentUserRole: string) {
    // Allow users with any role to see their own project requests
    return await db.query.projectRequests.findMany({
      where: eq(schemas.projectRequests.userId, currentUserId),
      orderBy: [desc(schemas.projectRequests.createdAt)],
    })
  }

  async getProjectRequestsByUserId(userId: string) {
    // Get project requests for a specific user
    return await db.query.projectRequests.findMany({
      where: eq(schemas.projectRequests.userId, userId),
      orderBy: [desc(schemas.projectRequests.createdAt)],
    })
  }

  async createProjectRequest(input: any, currentUserId: string) {
    const [request] = await db
      .insert(schemas.projectRequests)
      .values({
        userId: currentUserId,
        projectName: input.projectName,
        title: input.title,
        description: input.description,
        projectType: input.projectType,
        budget: input.budget,
        timeline: input.timeline,
        requirements: input.requirements,
        contactPreference: input.contactPreference,
        additionalInfo: input.additionalInfo,
      })
      .returning()

    if (!request) {
      throw new GraphQLError('Failed to create project request', {
        extensions: { code: 'CREATION_FAILED' },
      })
    }
    logger.info(`Project request created: ${request.id}`)
    return request
  }

  async updateProjectRequest(
    id: string,
    input: any,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const request = await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, id),
    })

    if (!request) {
      throw new GraphQLError('Project request not found', {
        extensions: { code: 'PROJECT_REQUEST_NOT_FOUND' },
      })
    }

    // Check permissions - allow if it's your own request OR you're an admin/super_admin
    if (
      request.userId !== currentUserId &&
      !isAdminRole(isUserRole(currentUserRole) ? currentUserRole : null)
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Only admins/super_admins can change status to approved
    if (
      input.status === 'approved' &&
      !isAdminRole(isUserRole(currentUserRole) ? currentUserRole : null)
    ) {
      throw new GraphQLError('Only admins can approve project requests', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'title',
      'description',
      'projectType',
      'budget',
      'timeline',
      'requirements',
      'contactPreference',
      'additionalInfo',
      'status',
    ] as const

    const sanitizedInput = Object.fromEntries(
      Object.entries(input).filter(([key]) =>
        allowedFields.includes(key as any)
      )
    )

    const [updatedRequest] = await db
      .update(schemas.projectRequests)
      .set({
        ...sanitizedInput,
        updatedAt: new Date(),
      })
      .where(eq(schemas.projectRequests.id, id))
      .returning()

    logger.info(`Project request updated: ${id}`)
    return updatedRequest
  }

  async approveProjectRequest(id: string, currentUserRole?: string) {
    // Optional: enforce at service layer as defense-in-depth
    if (!isAdminRole(isUserRole(currentUserRole) ? currentUserRole : null)) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const request = await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, id),
    })

    if (!request) {
      throw new GraphQLError('Project request not found', {
        extensions: { code: 'PROJECT_REQUEST_NOT_FOUND' },
      })
    }

    // Align with route: require 'in_review' (or agree on a single status)
    if (request.status !== 'in_review') {
      throw new GraphQLError('Project request must be in review to approve', {
        extensions: { code: 'INVALID_STATUS' },
      })
    }

    // Atomic transition + project creation
    const project = await db.transaction(async (tx) => {
      const updated = await tx
        .update(schemas.projectRequests)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schemas.projectRequests.id, id),
            eq(schemas.projectRequests.status, 'in_review')
          )
        )
        .returning({ id: schemas.projectRequests.id })

      if (updated.length === 0) {
        throw new GraphQLError('Request not in approvable state', {
          extensions: { code: 'CONFLICT' },
        })
      }

      const [created] = await tx
        .insert(schemas.projects)
        .values({
          clientId: request.userId,
          projectName: request.projectName,
          title: request.title,
          description: request.description,
          projectType: request.projectType,
          budget: request.budget,
          requirements: request.requirements,
          status: 'approved',
          featured: false,
        })
        .returning()

      if (!created) {
        throw new GraphQLError('Failed to create project from request', {
          extensions: { code: 'PROJECT_CREATION_FAILED' },
        })
      }

      return created
    })

    logger.info(`Project request approved and project created: ${project.id}`)
    return project
  }

  async rejectProjectRequest(id: string) {
    const [request] = await db
      .update(schemas.projectRequests)
      .set({
        status: 'cancelled',
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schemas.projectRequests.id, id))
      .returning()

    logger.info(`Project request rejected: ${id}`)
    return request
  }
}
