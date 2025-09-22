import {
  Arg,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'

import type { ProjectRecord } from '@/models'
import type { FileService, ProjectService, UserService } from '@/services'

import { SUPPORT_EMAIL } from '@/constants'
import {
  CreateProjectInput,
  Project,
  ProjectCollaborator,
  ProjectFilter,
  ProjectRequest,
  StatusUpdate,
  UpdateProjectInput,
  UserRole,
} from '@/graphql/schema'
import { logger } from '@/libs/Logger'

@Resolver(() => Project)
export class ProjectResolver {
  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private fileService: FileService
  ) {}

  @Query(() => [Project])
  async projects(
    @Arg('filter', () => ProjectFilter, { nullable: true })
    filter?: ProjectFilter,
    @Arg('userEmail', { nullable: true }) userEmail?: string
  ) {
    // Allow public access for SUPPORT_EMAIL without authentication
    if (userEmail === SUPPORT_EMAIL) {
      return await this.projectService.getProjects(filter)
    }

    // For other users, require authentication
    const currentUser = await this.userService.getCurrentUserWithAuth()

    if (userEmail) {
      const user = await this.userService.getUserByEmail(userEmail)
      if (user) {
        return await this.projectService.getProjects(filter, user.id, user.role)
      }
    }
    return await this.projectService.getProjects(
      filter,
      currentUser.id,
      currentUser.role
    )
  }

  @Query(() => Project, { nullable: true })
  async project(@Arg('id', () => ID) id: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    return await this.projectService.getProjectById(
      id,
      currentUser.id,
      currentUser.role
    )
  }

  @Query(() => Project, { nullable: true })
  async projectBySlug(@Arg('slug', () => String) slug: string) {
    // Try to get current user if authenticated, but don't require it for public access
    let currentUserId: string | undefined
    let currentUserRole: string | undefined

    try {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      currentUserId = currentUser.id
      currentUserRole = currentUser.role
    } catch {
      // No auth - allow public access to c0d3ster projects only
    }

    return await this.projectService.getProjectBySlug(
      slug,
      currentUserId,
      currentUserRole
    )
  }

  @Query(() => [Project])
  async featuredProjects(
    @Arg('userEmail', { nullable: true }) userEmail?: string
  ) {
    // Allow public access for SUPPORT_EMAIL without authentication
    if (userEmail === SUPPORT_EMAIL) {
      return await this.projectService.getFeaturedProjects()
    }

    // For other users, require authentication
    await this.userService.getCurrentUserWithAuth()

    if (userEmail) {
      const user = await this.userService.getUserByEmail(userEmail)
      if (user) {
        return await this.projectService.getFeaturedProjects(user.id)
      }
    }
    return await this.projectService.getFeaturedProjects()
  }

  @Mutation(() => Project)
  async createProject(
    @Arg('input', () => CreateProjectInput) input: CreateProjectInput
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return await this.projectService.createProject(input)
  }

  @Mutation(() => Project)
  async updateProject(
    @Arg('id', () => ID) id: string,
    @Arg('input', () => UpdateProjectInput) input: UpdateProjectInput
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    return await this.projectService.updateProject(
      id,
      input,
      currentUser.id,
      currentUser.role
    )
  }

  @Mutation(() => Project)
  async assignProject(
    @Arg('projectId', () => ID) projectId: string,
    @Arg('developerId', () => ID) developerId: string
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    return await this.projectService.assignProject(
      projectId,
      developerId,
      currentUser.id,
      currentUser.role
    )
  }

  @Mutation(() => Project)
  async updateProjectStatus(
    @Arg('id', () => ID) id: string,
    @Arg('status', () => String) status: string,
    @Arg('progressPercentage', { nullable: true }) progressPercentage?: number
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    return await this.projectService.updateProjectStatus(
      id,
      {
        newStatus: status,
        progressPercentage,
        updateMessage: `Status updated to ${status}`,
        isClientVisible: true,
      },
      currentUser.id,
      currentUser.role
    )
  }

  @FieldResolver(() => String, { nullable: true })
  requestId(@Root() parent: ProjectRecord) {
    return parent.requestId || null
  }

  @FieldResolver(() => String, { nullable: true })
  async client(@Root() parent: ProjectRecord) {
    if (!parent.clientId) return null
    return await this.userService.getUserById(parent.clientId)
  }

  @FieldResolver(() => String, { nullable: true })
  async developer(@Root() parent: ProjectRecord) {
    if (!parent.developerId) return null
    return await this.userService.getUserById(parent.developerId)
  }

  @FieldResolver(() => ProjectRequest, { nullable: true })
  async projectRequest(@Root() parent: ProjectRecord) {
    if (!parent.requestId) return null
    return await this.projectService.getProjectRequestById(parent.requestId)
  }

  @FieldResolver(() => [StatusUpdate], { nullable: true })
  async statusUpdates(@Root() parent: ProjectRecord) {
    let currentUserRole: string | undefined
    try {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      currentUserRole = currentUser.role
    } catch {
      // No auth - will filter to client-visible only
    }

    const updates = await this.projectService.getProjectStatusUpdates(
      parent.id,
      currentUserRole
    )
    return updates || []
  }

  @FieldResolver(() => [StatusUpdate], { nullable: true })
  async completeStatusHistory(@Root() parent: ProjectRecord) {
    let currentUserRole: string | undefined
    try {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      currentUserRole = currentUser.role
    } catch {
      // No auth - will filter to client-visible only
    }

    const updates = await this.projectService.getCompleteProjectStatusHistory(
      parent.id,
      currentUserRole
    )
    return updates || []
  }

  @FieldResolver(() => [ProjectCollaborator], { nullable: true })
  async collaborators(@Root() _parent: ProjectRecord) {
    // TODO: Implement collaborators functionality
    // For now, always return empty array
    return []
  }

  @FieldResolver(() => String, { nullable: true })
  createdAt(@Root() parent: ProjectRecord) {
    if (!parent.createdAt) return null
    try {
      return new Date(parent.createdAt).toISOString()
    } catch (error) {
      logger.error('Error formatting createdAt', {
        error: String(error),
        value: parent.createdAt,
      })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  updatedAt(@Root() parent: ProjectRecord) {
    if (!parent.updatedAt) return null
    try {
      return new Date(parent.updatedAt).toISOString()
    } catch (error) {
      logger.error('Error formatting updatedAt', {
        error: String(error),
        value: parent.updatedAt,
      })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  startDate(@Root() parent: ProjectRecord) {
    if (!parent.startDate) return null
    try {
      return new Date(parent.startDate).toISOString()
    } catch (error) {
      logger.error('Error formatting startDate', {
        error: String(error),
        value: parent.startDate,
      })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  estimatedCompletionDate(@Root() parent: ProjectRecord) {
    if (!parent.estimatedCompletionDate) return null
    try {
      return new Date(parent.estimatedCompletionDate).toISOString()
    } catch (error) {
      logger.error('Error formatting estimatedCompletionDate', {
        error: String(error),
        value: parent.estimatedCompletionDate,
      })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  actualCompletionDate(@Root() parent: ProjectRecord) {
    if (!parent.actualCompletionDate) return null
    try {
      return new Date(parent.actualCompletionDate).toISOString()
    } catch (error) {
      logger.error('Error formatting actualCompletionDate', {
        error: String(error),
        value: parent.actualCompletionDate,
      })
      return null
    }
  }

  @FieldResolver(() => [String], { nullable: true })
  techStack(@Root() parent: ProjectRecord) {
    if (!parent.techStack) return null
    try {
      return Array.isArray(parent.techStack)
        ? parent.techStack
        : JSON.parse(parent.techStack)
    } catch (error) {
      logger.error('Error parsing techStack', {
        value: parent.techStack,
        error,
      })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  requirements(@Root() parent: ProjectRecord) {
    if (!parent.requirements) return null
    try {
      return typeof parent.requirements === 'string'
        ? parent.requirements
        : JSON.stringify(parent.requirements)
    } catch (error) {
      logger.error('Error formatting requirements', {
        value: parent.requirements,
        error,
      })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  async logo(@Root() parent: ProjectRecord) {
    if (!parent.logo) return null

    // If it's a public asset path, return as-is
    if (parent.logo.startsWith('/assets/')) {
      return parent.logo
    }

    // If it's an R2 bucket path (contains projects/ or users/), generate presigned URL
    if (parent.logo.includes('projects/') || parent.logo.includes('users/')) {
      try {
        const presignedUrl =
          await this.fileService.generatePresignedDownloadUrl(parent.logo)
        return presignedUrl
      } catch (error) {
        logger.error('Error generating presigned URL for logo', {
          error: String(error),
          logo: parent.logo,
        })
        return null
      }
    }

    // Fallback: return as-is (could be external URL or other path)
    return parent.logo
  }
}
