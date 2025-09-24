import { and, asc, desc, eq, exists, isNull, ne, or } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import type { ProjectFilter } from '@/graphql/schema'
import type { ProjectRecord } from '@/models'

import { ProjectStatus, UserRole } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projectStatusEnum, schemas } from '@/models'
import {
  findProjectBySlug,
  hasSlugConflict,
  isAdminRole,
  isDeveloperOrHigherRole,
} from '@/utils'

import type { FileService } from './FileService'

export class ProjectService {
  constructor(private fileService: FileService) {}

  async getProjects(
    filter?: ProjectFilter,
    currentUserId?: string,
    currentUserRole?: string
  ): Promise<ProjectRecord[]> {
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
    if (currentUserRole === UserRole.Client && currentUserId) {
      whereClause = whereClause
        ? and(whereClause, eq(schemas.projects.clientId, currentUserId))
        : eq(schemas.projects.clientId, currentUserId)
    } else if (currentUserRole === UserRole.Developer && currentUserId) {
      whereClause = whereClause
        ? and(whereClause, eq(schemas.projects.developerId, currentUserId))
        : eq(schemas.projects.developerId, currentUserId)
    }
    // Admins and super_admins can see all projects - no additional filtering needed

    return await db.query.projects.findMany({
      where: whereClause,
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async getProjectById(
    id: string,
    currentUserId?: string,
    currentUserRole?: string
  ): Promise<ProjectRecord> {
    const project = await db.query.projects.findFirst({
      where: eq(schemas.projects.id, id),
    })

    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    }

    // Admins can access all projects
    if (isAdminRole(currentUserRole)) {
      return project
    }

    // Check access permissions
    if (
      currentUserRole === UserRole.Client &&
      project.clientId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    if (
      currentUserRole === UserRole.Developer &&
      project.developerId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return project
  }

  async getProjectBySlug(
    slug: string,
    currentUserId?: string,
    currentUserRole?: string
  ): Promise<ProjectRecord> {
    // Get all projects and find the one that matches the slug
    const allProjects = await db.query.projects.findMany()

    const project = findProjectBySlug<ProjectRecord>(slug, allProjects)

    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    }

    // If no user is provided (public access), only allow access to c0d3ster's projects
    if (!currentUserId || !currentUserRole) {
      // Get c0d3ster's user ID
      const c0d3sterUser = await db.query.users.findFirst({
        where: eq(schemas.users.email, 'support@c0d3ster.com'),
      })

      if (!c0d3sterUser) {
        throw new GraphQLError('Access denied', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // Only allow public access if c0d3ster is the developer or the client
      if (
        project.developerId !== c0d3sterUser.id &&
        project.clientId !== c0d3sterUser.id
      ) {
        throw new GraphQLError('Access denied', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      return project
    }

    // Admins can access all projects
    if (isAdminRole(currentUserRole)) {
      return project
    }

    // Check access permissions
    if (currentUserRole === 'client' && project.clientId !== currentUserId) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    if (
      currentUserRole === UserRole.Developer &&
      project.developerId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return project
  }

  async getMyProjects(
    currentUserId: string,
    currentUserRole?: string
  ): Promise<ProjectRecord[]> {
    // "My Projects" should return projects where the user is:
    // 1. The CLIENT (they own the project)
    // 2. A COLLABORATOR (they're working on it but not the main developer)
    // It should NOT include projects where they're the main assigned developer
    // (those go in "Assigned Projects")
    // For admins, return ALL projects

    // Admins see all projects
    if (currentUserRole && isAdminRole(currentUserRole)) {
      const allProjects = await db.query.projects.findMany({
        orderBy: [desc(schemas.projects.createdAt)],
      })

      return allProjects
    }

    // Single query using OR conditions
    const projects = await db
      .select()
      .from(schemas.projects)
      .where(
        or(
          // User is the client
          eq(schemas.projects.clientId, currentUserId),
          // User is a collaborator but NOT the main developer
          and(
            exists(
              db
                .select()
                .from(schemas.projectCollaborators)
                .where(
                  and(
                    eq(
                      schemas.projectCollaborators.projectId,
                      schemas.projects.id
                    ),
                    eq(schemas.projectCollaborators.userId, currentUserId)
                  )
                )
            ),
            ne(schemas.projects.developerId, currentUserId)
          )
        )
      )
      .orderBy(desc(schemas.projects.createdAt))

    return projects
  }

  async getAvailableProjects(): Promise<ProjectRecord[]> {
    return await db.query.projects.findMany({
      where: and(
        eq(schemas.projects.status, ProjectStatus.Approved),
        isNull(schemas.projects.developerId)
      ),
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async getFeaturedProjects(userId?: string): Promise<ProjectRecord[]> {
    let whereClause: any = eq(schemas.projects.featured, true)

    // If a user is specified, filter by that user's projects
    if (userId) {
      whereClause = and(
        eq(schemas.projects.featured, true),
        eq(schemas.projects.clientId, userId)
      )
    }

    return await db.query.projects.findMany({
      where: whereClause,
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async getPublicProjects(): Promise<ProjectRecord[]> {
    return await db.query.projects.findMany({
      where: eq(schemas.projects.featured, true),
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async getAssignedProjects(developerId: string): Promise<ProjectRecord[]> {
    return await db.query.projects.findMany({
      where: eq(schemas.projects.developerId, developerId),
      orderBy: [desc(schemas.projects.createdAt)],
    })
  }

  async createProject(input: any) {
    // Check for slug conflicts before creating
    const existingProjects = await db.query.projects.findMany({
      columns: { id: true, projectName: true },
    })

    if (hasSlugConflict(input.projectName, existingProjects)) {
      throw new GraphQLError('Project name would create a duplicate slug', {
        extensions: { code: 'DUPLICATE_SLUG' },
      })
    }

    // Validate project status
    if (input.status && !projectStatusEnum.enumValues.includes(input.status)) {
      throw new GraphQLError(
        `Invalid project status. Must be one of: ${projectStatusEnum.enumValues.join(', ')}`,
        {
          extensions: { code: 'INVALID_STATUS' },
        }
      )
    }

    const [project] = await db
      .insert(schemas.projects)
      .values({
        clientId: input.clientId,
        requestId: input.requestId,
        title: input.title,
        projectName: input.projectName,
        description: input.description,
        projectType: input.projectType,
        budget: input.budget,
        requirements: input.requirements,
        techStack: input.techStack,
        status: input.status,
        featured: false,
      })
      .returning()

    if (!project) {
      throw new GraphQLError('Failed to create project', {
        extensions: { code: 'CREATION_FAILED' },
      })
    }

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
      currentUserRole === UserRole.Developer &&
      project.developerId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Validate project status if it's being updated
    if (input.status && !projectStatusEnum.enumValues.includes(input.status)) {
      throw new GraphQLError(
        `Invalid project status. Must be one of: ${projectStatusEnum.enumValues.join(', ')}`,
        {
          extensions: { code: 'INVALID_STATUS' },
        }
      )
    }

    // Check if status is being changed
    const isStatusChange = input.status && input.status !== project.status

    // Handle logo update - logo-specific logic will be handled separately in FileResolver
    // We only update the project.logo field here, not create project_files entries

    const [updatedProject] = await db
      .update(schemas.projects)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(schemas.projects.id, id))
      .returning()

    // Create status update record if status was changed
    if (isStatusChange && currentUserId) {
      await db.insert(schemas.statusUpdates).values({
        entityType: 'project',
        entityId: id,
        oldStatus: project.status,
        newStatus: input.status as ProjectStatus,
        updateMessage: `Status updated to ${input.status}`,
        isClientVisible: true,
        updatedBy: currentUserId,
      })
    }

    return updatedProject
  }

  async updateProjectLogo(
    projectId: string,
    logoKey: string,
    uploadedBy: string,
    oldLogoKey?: string | null
  ) {
    // Delete old logo from R2 if it exists and is stored in R2
    if (
      oldLogoKey &&
      (oldLogoKey.includes('projects/') || oldLogoKey.includes('users/'))
    ) {
      try {
        await this.fileService.deleteFile(oldLogoKey)
      } catch (error) {
        // Log but don't fail the operation
        logger.warn(`Failed to delete old logo: ${oldLogoKey}`, {
          error,
        })
        // Continue with upload even if old logo deletion fails
      }
    }

    // Try to get file metadata from storage (for existing files)
    const fileMetadata = await this.fileService.getFileMetadata(logoKey)
    if (!fileMetadata) {
      // If metadata is not available, this might be a fresh upload
      // In that case, we'll skip creating the project_files entry for now
      // The entry will be created later when the file is actually uploaded and processed
      logger.warn(
        `Could not retrieve file metadata for logo: ${logoKey}. Skipping project_files entry creation.`
      )
      return
    }

    // Use FileService to create project_files entry
    await this.fileService.createProjectFileRecord({
      projectId,
      fileName: fileMetadata.fileName,
      originalFileName: fileMetadata.originalFileName,
      contentType: fileMetadata.contentType,
      fileSize: fileMetadata.fileSize,
      filePath: logoKey,
      uploadedBy,
      isClientVisible: true,
      description: 'Project logo',
    })
  }

  async updateProjectLogoWithMetadata(
    projectId: string,
    logoKey: string,
    metadata: {
      fileName: string
      originalFileName: string
      fileSize: number
      contentType: string
    },
    uploadedBy: string,
    oldLogoKey?: string | null
  ) {
    // Delete old logo from R2 if it exists and is stored in R2
    if (
      oldLogoKey &&
      (oldLogoKey.includes('projects/') || oldLogoKey.includes('users/'))
    ) {
      try {
        await this.fileService.deleteFile(oldLogoKey)
      } catch (error) {
        // Log but don't fail the operation
        logger.warn(`Failed to delete old logo: ${oldLogoKey}`, {
          error,
        })
        // Continue with upload even if old logo deletion fails
      }
    }

    // Use the provided metadata directly (for fresh uploads)
    await this.fileService.createProjectFileRecord({
      projectId,
      fileName: metadata.fileName,
      originalFileName: metadata.originalFileName,
      contentType: metadata.contentType,
      fileSize: metadata.fileSize,
      filePath: logoKey,
      uploadedBy,
      isClientVisible: true,
      description: 'Project logo',
    })
  }

  async assignProject(
    projectId: string,
    developerId: string,
    currentUserId: string,
    currentUserRole?: string
  ) {
    // Check permissions - developers can assign themselves, admins can assign anyone
    if (!isDeveloperOrHigherRole(currentUserRole)) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Developers can only assign themselves unless they're admin
    if (
      currentUserRole === UserRole.Developer &&
      developerId !== currentUserId
    ) {
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
        status: ProjectStatus.InProgress,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schemas.projects.id, projectId),
          eq(schemas.projects.status, ProjectStatus.Approved),
          isNull(schemas.projects.developerId)
        )
      )
      .returning()

    if (!updatedProject) {
      throw new GraphQLError('Failed to assign project', {
        extensions: { code: 'ASSIGNMENT_FAILED' },
      })
    }

    // Create status update for the assignment
    await db.insert(schemas.statusUpdates).values({
      entityType: 'project',
      entityId: projectId,
      oldStatus: ProjectStatus.Approved,
      newStatus: ProjectStatus.InProgress,
      updateMessage: `Project assigned to developer and status updated to in progress`,
      isClientVisible: true,
      updatedBy: currentUserId,
    })

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
      currentUserRole === UserRole.Developer &&
      project.developerId !== currentUserId
    ) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Create status update
    const [statusUpdate] = await db
      .insert(schemas.statusUpdates)
      .values({
        entityType: 'project',
        entityId: id,
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

    return statusUpdate
  }

  async getProjectStatusUpdates(projectId: string, currentUserRole?: string) {
    const baseWhere = and(
      eq(schemas.statusUpdates.entityType, 'project'),
      eq(schemas.statusUpdates.entityId, projectId)
    )

    const whereClause = isAdminRole(currentUserRole)
      ? baseWhere
      : and(baseWhere, eq(schemas.statusUpdates.isClientVisible, true))

    return await db.query.statusUpdates.findMany({
      where: whereClause,
      orderBy: [asc(schemas.statusUpdates.createdAt)],
    })
  }

  async getCompleteProjectStatusHistory(
    projectId: string,
    currentUserRole?: string
  ) {
    const project = await db.query.projects.findFirst({
      where: eq(schemas.projects.id, projectId),
    })

    if (!project) {
      throw new GraphQLError('Project not found', {
        extensions: { code: 'PROJECT_NOT_FOUND' },
      })
    }

    logger.info('Getting complete status history', {
      projectId,
      requestId: project.requestId,
      currentUserRole,
    })

    // Debug: Check what status updates exist for this project
    const whereConditions = [eq(schemas.statusUpdates.entityId, projectId)]
    if (project.requestId) {
      whereConditions.push(
        eq(schemas.statusUpdates.entityId, project.requestId)
      )
    }

    const allUpdates = await db.query.statusUpdates.findMany({
      where: or(...whereConditions),
    })

    logger.info('All status updates for project/request', {
      allUpdates: allUpdates.map((u) => ({
        id: u.id,
        entityType: u.entityType,
        entityId: u.entityId,
        newStatus: u.newStatus,
        isClientVisible: u.isClientVisible,
      })),
    })

    // Get status updates for both the project and its original request
    const conditions = []

    // Always look for project status updates
    conditions.push(
      and(
        eq(schemas.statusUpdates.entityType, 'project'),
        eq(schemas.statusUpdates.entityId, projectId)
      )
    )

    // If this project was created from a request, include the request status updates
    if (project.requestId) {
      conditions.push(
        and(
          eq(schemas.statusUpdates.entityType, 'project_request'),
          eq(schemas.statusUpdates.entityId, project.requestId)
        )
      )
    }

    const baseWhere = or(...conditions)
    const whereClause = isAdminRole(currentUserRole)
      ? baseWhere
      : and(baseWhere, eq(schemas.statusUpdates.isClientVisible, true))

    const updates = await db.query.statusUpdates.findMany({
      where: whereClause,
      orderBy: [asc(schemas.statusUpdates.createdAt)],
    })

    logger.info('Found status updates', {
      count: updates.length,
      updates: updates.map((u) => ({
        id: u.id,
        entityType: u.entityType,
        entityId: u.entityId,
        newStatus: u.newStatus,
        isClientVisible: u.isClientVisible,
      })),
    })

    return updates
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
