import { and, desc, eq, isNull, ne } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'
import { isDeveloperOrHigherRole, isUserRole } from '@/utils'

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
            : conditions
                .slice(1)
                .reduce((acc, condition) => and(acc, condition), conditions[0])
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

    // Admins can access all projects
    if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
      return project
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

  async getMyProjects(currentUserId: string) {
    // "My Projects" should return projects where the user is:
    // 1. The CLIENT (they own the project)
    // 2. A COLLABORATOR (they're working on it but not the main developer)
    // It should NOT include projects where they're the main assigned developer
    // (those go in "Assigned Projects")

    const clientProjects = await db.query.projects.findMany({
      where: eq(schemas.projects.clientId, currentUserId),
      orderBy: [desc(schemas.projects.createdAt)],
    })

    const collaboratorProjects = await db
      .select()
      .from(schemas.projects)
      .innerJoin(
        schemas.projectCollaborators,
        eq(schemas.projects.id, schemas.projectCollaborators.projectId)
      )
      .where(
        and(
          eq(schemas.projectCollaborators.userId, currentUserId),
          // Exclude projects where user is the main developer (those go in assigned projects)
          ne(schemas.projects.developerId, currentUserId)
        )
      )
      .orderBy(desc(schemas.projects.createdAt))

    // Combine and deduplicate (in case user is both client and collaborator)
    const allProjects = [
      ...clientProjects,
      ...collaboratorProjects.map((item) => item.projects),
    ]

    // Remove duplicates by ID
    const uniqueProjects = allProjects.filter(
      (project, index, self) =>
        index === self.findIndex((p) => p.id === project.id)
    )

    return uniqueProjects.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async getAvailableProjects() {
    return await db.query.projects.findMany({
      where: and(
        eq(schemas.projects.status, 'approved'),
        isNull(schemas.projects.developerId)
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

    if (!project) {
      throw new GraphQLError('Failed to create project', {
        extensions: { code: 'CREATION_FAILED' },
      })
    }
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

  async assignProject(
    projectId: string,
    developerId: string,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    // Check permissions - developers can assign themselves, admins can assign anyone
    if (
      !isDeveloperOrHigherRole(
        isUserRole(currentUserRole) ? currentUserRole : null
      )
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Developers can only assign themselves unless they're admin
    if (currentUserRole === 'developer' && developerId !== currentUserId) {
      throw new GraphQLError(
        'Developers can only assign themselves to projects',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      )
    }

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
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schemas.projects.id, projectId),
          eq(schemas.projects.status, 'approved'),
          isNull(schemas.projects.developerId)
        )
      )
      .returning()

    if (!updatedProject) {
      throw new GraphQLError('Failed to assign project', {
        extensions: { code: 'ASSIGNMENT_FAILED' },
      })
    }

    logger.info(`Project assigned: ${projectId} to developer: ${developerId}`)
    return updatedProject
  }

  async updateProjectStatus(
    id: string,
    input: any,
    currentUserId?: string,
    currentUserRole?: string
  ) {
    if (!currentUserId) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHORIZED' },
      })
    }

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

  async getProjectStatusUpdates(projectId: string) {
    return await db.query.projectStatusUpdates.findMany({
      where: eq(schemas.projectStatusUpdates.projectId, projectId),
      orderBy: [desc(schemas.projectStatusUpdates.createdAt)],
    })
  }

  async getProjectCollaborators(projectId: string) {
    return await db.query.projectCollaborators.findMany({
      where: eq(schemas.projectCollaborators.projectId, projectId),
    })
  }

  async getProjectRequestById(projectRequestId: string) {
    return await db.query.projectRequests.findFirst({
      where: eq(schemas.projectRequests.id, projectRequestId),
    })
  }
}
