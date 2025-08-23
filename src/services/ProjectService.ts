import { and, desc, eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'

export class ProjectService {
  async getProjects(
    filter?: any,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    let whereClause
    if (filter) {
      const conditions = []
      if (filter.status) {
        conditions.push(eq(schemas.projects.status, filter.status))
      }
      if (filter.projectType) {
        conditions.push(eq(schemas.projects.projectType, filter.projectType))
      }
      if (filter.priority) {
        conditions.push(eq(schemas.projects.priority, filter.priority))
      }
      if (filter.clientId) {
        conditions.push(eq(schemas.projects.clientId, filter.clientId))
      }
      if (filter.developerId) {
        conditions.push(eq(schemas.projects.developerId, filter.developerId))
      }
      if (conditions.length > 0) {
        whereClause =
          conditions.length === 1
            ? conditions[0]
            : conditions.reduce((acc, condition) => acc && condition)
      }
    }

    // Apply role-based filtering
    if (currentUserRole === 'client' && currentUserId) {
      whereClause = whereClause
        ? and(whereClause, eq(schemas.projects.clientId, currentUserId))
        : eq(schemas.projects.clientId, currentUserId)
    } else if (currentUserRole === 'developer' && currentUserId) {
      whereClause = whereClause
        ? and(whereClause, eq(schemas.projects.developerId, currentUserId))
        : eq(schemas.projects.developerId, currentUserId)
    }

    return await db.query.projects.findMany({
      where: whereClause,
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async getProjectById(
    id: string,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const project = await db.query.projects.findFirst({
      where: eq(schemas.projects.id, id),
    })

    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    }

    // Check access permissions
    if (currentUserRole === 'client' && project.clientId !== currentUserId) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    if (
      currentUserRole === 'developer' &&
      project.developerId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return project
  }

  async getMyProjects(currentUserId: string, currentUserRole: string) {
    if (currentUserRole === 'client') {
      return await db.query.projects.findMany({
        where: eq(schemas.projects.clientId, currentUserId),
        orderBy: [desc(schemas.projects.createdAt)],
      })
    } else if (currentUserRole === 'developer') {
      return await db.query.projects.findMany({
        where: eq(schemas.projects.developerId, currentUserId),
        orderBy: [desc(schemas.projects.createdAt)],
      })
    }

    return []
  }

  async getAvailableProjects() {
    return await db.query.projects.findMany({
      where: and(
        eq(schemas.projects.status, 'approved'),
        eq(schemas.projects.developerId, null)
      ),
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async getAssignedProjects(developerId: string) {
    return await db.query.projects.findMany({
      where: eq(schemas.projects.developerId, developerId),
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async createProject(input: any) {
    const [project] = await db
      .insert(schemas.projects)
      .values({
        clientId: input.clientId,
        requestId: input.requestId,
        title: input.title,
        description: input.description,
        projectType: input.projectType,
        budget: input.budget,
        requirements: input.requirements,
        techStack: input.techStack,
      })
      .returning()

    logger.info(`Project created: ${project.id}`)
    return project
  }

  async updateProject(
    id: string,
    input: any,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const project = await db.query.projects.findFirst({
      where: eq(schemas.projects.id, id),
    })

    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    }

    // Check permissions
    if (currentUserRole === 'client' && project.clientId !== currentUserId) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    if (
      currentUserRole === 'developer' &&
      project.developerId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const [updatedProject] = await db
      .update(schemas.projects)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(schemas.projects.id, id))
      .returning()

    logger.info(`Project updated: ${id}`)
    return updatedProject
  }

  async assignProject(projectId: string, developerId: string) {
    const project = await db.query.projects.findFirst({
      where: eq(schemas.projects.id, projectId),
    })

    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    }

    if (project.developerId) {
      throw new GraphQLError('Project already assigned', {
        extensions: { code: 'PROJECT_ALREADY_ASSIGNED' },
      })
    }

    const [updatedProject] = await db
      .update(schemas.projects)
      .set({
        developerId,
        updatedAt: new Date(),
      })
      .where(eq(schemas.projects.id, projectId))
      .returning()

    logger.info(`Project assigned: ${projectId} to developer: ${developerId}`)
    return updatedProject
  }

  async updateProjectStatus(
    id: string,
    input: any,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    const project = await db.query.projects.findFirst({
      where: eq(schemas.projects.id, id),
    })

    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    }

    // Check permissions
    if (currentUserRole === 'client' && project.clientId !== currentUserId) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    if (
      currentUserRole === 'developer' &&
      project.developerId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Create status update
    const [statusUpdate] = await db
      .insert(schemas.projectStatusUpdates)
      .values({
        projectId: id,
        oldStatus: project.status,
        newStatus: input.newStatus,
        progressPercentage: input.progressPercentage,
        updateMessage: input.updateMessage,
        isClientVisible: input.isClientVisible,
        updatedBy: currentUserId!,
      })
      .returning()

    // Update project status
    await db
      .update(schemas.projects)
      .set({
        status: input.newStatus,
        progressPercentage: input.progressPercentage,
        updatedAt: new Date(),
      })
      .where(eq(schemas.projects.id, id))

    logger.info(`Project status updated: ${id} to ${input.newStatus}`)
    return statusUpdate
  }
}
