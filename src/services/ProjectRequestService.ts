import { desc, eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'
import { isAdminRole } from '@/utils'

export class ProjectRequestService {
  async getProjectRequests(filter?: any) {
    logger.error('🚀 SERVICE: getProjectRequests called', { filter })
    
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
            : conditions.reduce((acc, condition) => acc && condition)
      }
    }

    logger.error('🚀 SERVICE: About to query database', { whereClause })
    
    const results = await db.query.projectRequests.findMany({
      where: whereClause,
      orderBy: [desc(schemas.projectRequests.createdAt)],
    })

    logger.error('🚀 SERVICE: Database query completed', { 
      resultCount: results.length,
      firstResult: results[0] ? {
        id: results[0].id,
        status: results[0].status,
        createdAt: results[0].createdAt,
        createdAtType: typeof results[0].createdAt
      } : null
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
      !isAdminRole(currentUserRole || '')
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return request
  }

  async getMyProjectRequests(currentUserId: string, currentUserRole: string) {
    if (currentUserRole === 'client') {
      return await db.query.projectRequests.findMany({
        where: eq(schemas.projectRequests.userId, currentUserId),
        orderBy: [desc(schemas.projectRequests.createdAt)],
      })
    }

    return []
  }

  async createProjectRequest(input: any, currentUserId: string) {
    const [request] = await db
      .insert(schemas.projectRequests)
      .values({
        userId: currentUserId,
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
      !isAdminRole(currentUserRole || '')
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Only admins/super_admins can change status to approved
    if (input.status === 'approved' && !isAdminRole(currentUserRole || '')) {
      throw new GraphQLError('Only admins can approve project requests', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const [updatedRequest] = await db
      .update(schemas.projectRequests)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(schemas.projectRequests.id, id))
      .returning()

    logger.info(`Project request updated: ${id}`)
    return updatedRequest
  }

  async approveProjectRequest(id: string) {
    const request = await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, id),
    })

    if (!request) {
      throw new GraphQLError('Project request not found', {
        extensions: { code: 'PROJECT_REQUEST_NOT_FOUND' },
      })
    }

    if (request.status !== 'requested') {
      throw new GraphQLError('Project request cannot be approved', {
        extensions: { code: 'INVALID_STATUS' },
      })
    }

    // Update request status
    await db
      .update(schemas.projectRequests)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schemas.projectRequests.id, id))

    // Create project
    const [project] = await db
      .insert(schemas.projects)
      .values({
        requestId: id,
        clientId: request.userId,
        title: request.title,
        description: request.description,
        projectType: request.projectType,
        budget: request.budget,
        requirements: request.requirements,
      })
      .returning()

    if (!project) {
      throw new GraphQLError('Failed to create project from request', {
        extensions: { code: 'PROJECT_CREATION_FAILED' },
      })
    }
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
