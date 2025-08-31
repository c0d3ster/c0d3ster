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
  DisplayUser,
  ProjectRequest,
  ProjectRequestDisplay, 
UserRole 
} from '@/graphql/schema'
import { logger } from '@/libs/Logger'


@Resolver(() => ProjectRequest)
@Resolver(() => ProjectRequestDisplay)
export class ProjectRequestResolver {
  constructor(
    private projectRequestService: ProjectRequestService,
    private userService: UserService
  ) {}

  @Query(() => [ProjectRequestDisplay])
  async projectRequests(
    @Arg('filter', () => Object, { nullable: true }) filter?: any
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

    return await this.projectRequestService.approveProjectRequest(id)
  }

  @Mutation(() => String)
  async rejectProjectRequest(@Arg('id', () => ID) id: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)

    return await this.projectRequestService.rejectProjectRequest(id)
  }

  @FieldResolver(() => DisplayUser, { nullable: true })
  async user(@Root() parent: any) {
    const user = await this.userService.getUserById(parent.userId)
    if (!user) return null

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }
  }

  @FieldResolver(() => DisplayUser, { nullable: true })
  async reviewer(@Root() parent: any) {
    if (!parent.reviewedBy) return null
    const user = await this.userService.getUserById(parent.reviewedBy)
    if (!user) return null

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }
  }

  @FieldResolver(() => String, { nullable: true })
  createdAt(@Root() parent: any) {
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
  updatedAt(@Root() parent: any) {
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

  @FieldResolver(() => String, { nullable: true })
  reviewedAt(@Root() parent: any) {
    if (!parent.reviewedAt) return null
    try {
      const date = new Date(parent.reviewedAt)
      if (Number.isNaN(date.getTime())) {
        logger.error('Invalid date value', { value: parent.reviewedAt })
        return null
      }
      return date.toISOString()
    } catch (error) {
      logger.error('Error formatting reviewedAt', {
        error: String(error),
        value: parent.reviewedAt,
      })
      return null
    }
  }
}
