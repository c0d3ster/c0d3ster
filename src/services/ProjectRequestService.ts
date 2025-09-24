import { and, asc, desc, eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import type {
  CreateProjectRequestInput,
  ProjectRequestFilter,
} from '@/graphql/schema'
import type { ProjectRequestRecord } from '@/models'

import { ProjectStatus } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { schemas } from '@/models'
import { isAdminRole } from '@/utils'

export class ProjectRequestService {
  async getProjectRequests(
    filter?: ProjectRequestFilter
  ): Promise<ProjectRequestRecord[]> {
    let whereClause
    if (filter) {
      const conditions = []
      if (filter.status) {
        conditions.push(
          eq(schemas.projectRequests.status, filter.status as ProjectStatus)
        )
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
  ): Promise<ProjectRequestRecord> {
    const request = await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, id),
    })

    if (!request) {
      throw new GraphQLError('Project request not found', {
        extensions: { code: 'PROJECT_REQUEST_NOT_FOUND' },
      })
    }

    // Check access permissions - allow if it's your own request OR you're an admin/super_admin
    if (request.userId !== currentUserId && !isAdminRole(currentUserRole)) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return request
  }

  async getMyProjectRequests(
    currentUserId: string,
    currentUserRole: string
  ): Promise<ProjectRequestRecord[]> {
    // Admins can see all project requests, others see only their own
    if (isAdminRole(currentUserRole)) {
      return await this.getProjectRequests()
    }

    return await db.query.projectRequests.findMany({
      where: eq(schemas.projectRequests.userId, currentUserId),
      orderBy: [desc(schemas.projectRequests.createdAt)],
    })
  }

  async getProjectRequestsByUserId(
    userId: string
  ): Promise<ProjectRequestRecord[]> {
    // Get project requests for a specific user
    return await db.query.projectRequests.findMany({
      where: eq(schemas.projectRequests.userId, userId),
      orderBy: [desc(schemas.projectRequests.createdAt)],
    })
  }

  async createProjectRequest(
    input: CreateProjectRequestInput,
    currentUserId: string
  ): Promise<ProjectRequestRecord> {
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

    return request
  }

  async updateProjectRequest(
    id: string,
    input: { status?: string; [key: string]: any },
    currentUserId?: string,
    currentUserRole?: string
  ): Promise<ProjectRequestRecord> {
    const request = await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, id),
    })

    if (!request) {
      throw new GraphQLError('Project request not found', {
        extensions: { code: 'PROJECT_REQUEST_NOT_FOUND' },
      })
    }

    // Check permissions - allow if it's your own request OR you're an admin/super_admin
    if (request.userId !== currentUserId && !isAdminRole(currentUserRole)) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Only admins/super_admins can change status to approved
    if (
      input.status === ProjectStatus.Approved &&
      !isAdminRole(currentUserRole)
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
        allowedFields.includes(key as (typeof allowedFields)[number])
      )
    )

    // Check if status is being changed
    const isStatusChange = input.status && input.status !== request.status

    const [updatedRequest] = await db
      .update(schemas.projectRequests)
      .set({
        ...sanitizedInput,
        updatedAt: new Date(),
      })
      .where(eq(schemas.projectRequests.id, id))
      .returning()

    if (!updatedRequest) {
      throw new GraphQLError('Failed to update project request', {
        extensions: { code: 'UPDATE_FAILED' },
      })
    }

    // Create status update record if status was changed
    if (isStatusChange && currentUserId) {
      await db.insert(schemas.statusUpdates).values({
        entityType: 'project_request',
        entityId: id,
        oldStatus: request.status,
        newStatus: input.status! as ProjectStatus,
        updateMessage: `Status updated to ${input.status}`,
        isClientVisible: true,
        updatedBy: currentUserId,
      })
    }

    return updatedRequest
  }

  async approveProjectRequest(
    id: string,
    currentUserId?: string,
    currentUserRole?: string
  ): Promise<any> {
    // Optional: enforce at service layer as defense-in-depth
    if (!isAdminRole(currentUserRole)) {
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
    if (request.status !== ProjectStatus.InReview) {
      throw new GraphQLError('Project request must be in review to approve', {
        extensions: { code: 'INVALID_STATUS' },
      })
    }

    // Atomic transition + project creation + status update
    const project = await db.transaction(async (tx) => {
      const updated = await tx
        .update(schemas.projectRequests)
        .set({
          status: ProjectStatus.Approved,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schemas.projectRequests.id, id),
            eq(schemas.projectRequests.status, ProjectStatus.InReview)
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
          requestId: id, // Link the project to its original request
          projectName: request.projectName,
          title: request.title,
          description: request.description,
          projectType: request.projectType,
          budget: request.budget,
          requirements: request.requirements,
          status: ProjectStatus.Approved,
          featured: false,
        })
        .returning()

      if (!created) {
        throw new GraphQLError('Failed to create project from request', {
          extensions: { code: 'PROJECT_CREATION_FAILED' },
        })
      }

      // Create status update record for the approval
      if (currentUserId) {
        await tx.insert(schemas.statusUpdates).values({
          entityType: 'project_request',
          entityId: id,
          oldStatus: request.status,
          newStatus: ProjectStatus.Approved,
          updateMessage: 'Project request approved and converted to project',
          isClientVisible: true,
          updatedBy: currentUserId,
        })
      }

      return created
    })

    return project
  }

  async rejectProjectRequest(
    id: string,
    currentUserId?: string
  ): Promise<ProjectRequestRecord> {
    const existingRequest = await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, id),
    })

    if (!existingRequest) {
      throw new GraphQLError('Project request not found', {
        extensions: { code: 'PROJECT_REQUEST_NOT_FOUND' },
      })
    }

    const [request] = await db
      .update(schemas.projectRequests)
      .set({
        status: ProjectStatus.Cancelled,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schemas.projectRequests.id, id))
      .returning()

    if (!request) {
      throw new GraphQLError('Failed to reject project request', {
        extensions: { code: 'REJECTION_FAILED' },
      })
    }

    // Create status update record for the rejection
    if (currentUserId) {
      await db.insert(schemas.statusUpdates).values({
        entityType: 'project_request',
        entityId: id,
        oldStatus: existingRequest.status,
        newStatus: ProjectStatus.Cancelled,
        updateMessage: 'Project request rejected',
        isClientVisible: true,
        updatedBy: currentUserId,
      })
    }

    return request
  }

  async getProjectRequestStatusUpdates(
    projectRequestId: string,
    currentUserRole?: string
  ) {
    const baseWhere = and(
      eq(schemas.statusUpdates.entityType, 'project_request'),
      eq(schemas.statusUpdates.entityId, projectRequestId)
    )

    const whereClause = isAdminRole(currentUserRole)
      ? baseWhere
      : and(baseWhere, eq(schemas.statusUpdates.isClientVisible, true))

    return await db.query.statusUpdates.findMany({
      where: whereClause,
      orderBy: [asc(schemas.statusUpdates.createdAt)],
    })
  }
}
