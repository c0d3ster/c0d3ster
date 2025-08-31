import { GraphQLError } from 'graphql'
import {
  Arg,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'

import type { UserService } from '@/services'

import {
  DisplayUser,
  UpdateUserInput,
  User,
  UserDashboard, 
UserRole 
} from '@/graphql/schema'
import { logger } from '@/libs/Logger'


@Resolver(() => User)
@Resolver(() => DisplayUser)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => User, { nullable: true })
  async me() {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    return currentUser
  }

  @Query(() => User, { nullable: true })
  async user(@Arg('id', () => ID) id: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)

    return await this.userService.getUserById(id)
  }

  @Query(() => [User])
  async users(@Arg('filter', () => Object, { nullable: true }) filter?: any) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)

    return await this.userService.getUsers(filter)
  }

  @Query(() => UserDashboard)
  async myDashboard() {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    // Return a placeholder object - the actual data will be resolved by field resolvers
    return { userId: currentUser.id }
  }

  @Mutation(() => User)
  async updateUser(
    @Arg('id', () => ID) id: string,
    @Arg('input', () => UpdateUserInput) input: UpdateUserInput
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    this.userService.checkPermission(currentUser, UserRole.Admin)

    // Users can only update themselves, or admins can update anyone
    if (currentUser.id !== id && currentUser.role !== UserRole.Admin) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const isAdmin = currentUser.role === UserRole.Admin
    const ALLOWED_SELF_UPDATE_FIELDS = [
      'firstName',
      'lastName',
      'avatarUrl',
      'bio',
      'availability',
      'portfolio',
      'skills',
      'hourlyRate',
    ] as const
    const PRIVILEGED_FIELDS = ['role'] as const

    const sanitizedInput = Object.fromEntries(
      Object.entries(input).filter(([key]) =>
        isAdmin ? true : ALLOWED_SELF_UPDATE_FIELDS.includes(key as any)
      )
    )

    // Extra guard: prevent privileged fields from slipping through for non-admins
    if (
      !isAdmin &&
      Object.keys(input).some((k) => PRIVILEGED_FIELDS.includes(k as any))
    ) {
      throw new GraphQLError('Cannot modify restricted fields', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return await this.userService.updateUser(id, sanitizedInput)
  }

  @FieldResolver(() => String, { nullable: true })
  createdAt(@Root() parent: any) {
    if (!parent.createdAt) return null
    try {
      const date = new Date(parent.createdAt)
      if (Number.isNaN(date.getTime())) {
        logger.error('Invalid date value for createdAt', {
          value: parent.createdAt,
        })
        return null
      }
      return date.toISOString()
    } catch (error) {
      logger.error('Error formatting createdAt date', {
        value: parent.createdAt,
        error,
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
        logger.error('Invalid date value for updatedAt', {
          value: parent.updatedAt,
        })
        return null
      }
      return date.toISOString()
    } catch (error) {
      logger.error('Error formatting updatedAt date', {
        value: parent.updatedAt,
        error,
      })
      return null
    }
  }

  @FieldResolver(() => [String], { nullable: true })
  skills(@Root() parent: any) {
    if (!parent.skills) return null
    try {
      return Array.isArray(parent.skills)
        ? parent.skills
        : JSON.parse(parent.skills)
    } catch (error) {
      logger.error('Error parsing skills', { value: parent.skills, error })
      return null
    }
  }

  @FieldResolver(() => String, { nullable: true })
  hourlyRate(@Root() parent: any) {
    if (parent.hourlyRate === null || parent.hourlyRate === undefined)
      return null
    return parent.hourlyRate.toString()
  }
}
