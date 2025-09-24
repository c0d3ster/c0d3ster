import { FieldResolver, Resolver, Root } from 'type-graphql'

import type { StatusUpdateRecord } from '@/models'
import type { UserService } from '@/services'

import { StatusUpdate, User } from '@/graphql/schema'

@Resolver(() => StatusUpdate)
export class StatusUpdateResolver {
  constructor(private userService: UserService) {}

  @FieldResolver(() => User, { nullable: true })
  async updatedByUser(@Root() parent: StatusUpdateRecord) {
    if (!parent.updatedBy) return null
    const user = await this.userService.getUserById(parent.updatedBy)
    if (!user) return null

    return user
  }
}
