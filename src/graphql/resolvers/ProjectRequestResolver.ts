import {
  Arg,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'

import type { ProjectRequestService, UserService } from '@/services'

import {
  CreateProjectRequestInput,
  ProjectRequest,
  ProjectRequestFilter,
  User,
  UserRole,
} from '@/graphql/schema'
import { logger } from '@/libs/Logger'

@Resolver(() => ProjectRequest)
export class ProjectRequestResolver {
  constructor(
    private projectRequestService: ProjectRequestService,
    private userService: UserService
  ) {}

  @Query(() => [ProjectRequest])
  async projectRequests(
    @Arg('filter', () => ProjectRequestFilter, { nullable: true })
    filter?: ProjectRequestFilter
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)

    const results = await this.projectRequestService.getProjectRequests(filter)
    return results
  }

  @Query(() => ProjectRequest, { nullable: true })
  async projectRequest(@Arg('id', () => ID) id: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    return await this.projectRequestService.getProjectRequestById(
      id,
      currentUser.id,
      currentUser.role
    )
  }

  @Mutation(() => ProjectRequest)
  async createProjectRequest(
    @Arg('input', () => CreateProjectRequestInput)
    input: CreateProjectRequestInput
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Client)

    return await this.projectRequestService.createProjectRequest(
      input,
      currentUser.id
    )
  }

  @Mutation(() => ProjectRequest)
  async updateProjectRequest(
    @Arg('id', () => ID) id: string,
    @Arg('input', () => CreateProjectRequestInput)
    input: CreateProjectRequestInput
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    return await this.projectRequestService.updateProjectRequest(
      id,
      input,
      currentUser.id,
      currentUser.role
    )
  }

  @Mutation(() => ProjectRequest)
  async updateProjectRequestStatus(
    @Arg('id', () => ID) id: string,
    @Arg('status', () => String) status: string
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)
    return await this.projectRequestService.updateProjectRequest(
      id,
      { status },
      currentUser.id,
      currentUser.role
    )
  }

  @Mutation(() => String)
  async approveProjectRequest(@Arg('id', () => ID) id: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)

    const project = await this.projectRequestService.approveProjectRequest(
      id,
      currentUser.id,
      currentUser.role
    )
    return project.id
  }

  @Mutation(() => String)
  async rejectProjectRequest(@Arg('id', () => ID) id: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)

    const updated = await this.projectRequestService.rejectProjectRequest(
      id,
      currentUser.id
    )
    return updated.id
  }

  @FieldResolver(() => User, { nullable: true })
  async user(@Root() parent: ProjectRequest) {
    if (!parent.userId) return null
    const user = await this.userService.getUserById(parent.userId)
    if (!user) return null

    return user
  }

  @FieldResolver(() => User, { nullable: true })
  async reviewer(@Root() parent: ProjectRequest) {
    if (!parent.reviewerId) return null
    const user = await this.userService.getUserById(parent.reviewerId)
    if (!user) return null

    return user
  }

  @FieldResolver(() => String, { nullable: true })
  requirements(@Root() parent: ProjectRequest) {
    if (!parent.requirements) return null

    // If it's already a string, return it
    if (typeof parent.requirements === 'string') {
      return parent.requirements
    }

    // If it's an object, stringify it and let the client handle formatting
    try {
      return JSON.stringify(parent.requirements)
    } catch (error) {
      logger.error('Error serializing requirements object', {
        error: String(error),
        requirements: parent.requirements,
      })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  createdAt(@Root() parent: ProjectRequest) {
    if (!parent.createdAt) {
      return null
    }
    try {
      const date = new Date(parent.createdAt)
      if (Number.isNaN(date.getTime())) {
        logger.error('Invalid date value', { value: parent.createdAt })
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
  }

  @FieldResolver(() => String, { nullable: true })
  updatedAt(@Root() parent: ProjectRequest) {
    if (!parent.updatedAt) return null
    try {
      const date = new Date(parent.updatedAt)
      if (Number.isNaN(date.getTime())) {
        logger.error('Invalid date value', { value: parent.updatedAt })
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
  }
}
