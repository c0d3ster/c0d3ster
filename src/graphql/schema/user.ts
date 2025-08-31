import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

export enum UserRole {
  Client = 'client',
  Developer = 'developer',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role in the system',
})

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  clerkId!: string

  @Field(() => String)
  email!: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  lastName?: string

  @Field(() => UserRole)
  role!: UserRole

  @Field(() => String, { nullable: true })
  bio?: string

  @Field(() => [String], { nullable: true })
  skills?: string[]

  @Field(() => String, { nullable: true })
  portfolio?: string

  @Field(() => Number, { nullable: true })
  hourlyRate?: number

  @Field(() => String, { nullable: true })
  availability?: string

  @Field(() => String, { nullable: true })
  avatarUrl?: string

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  updatedAt!: string
}

@ObjectType()
export class DisplayUser {
  @Field(() => ID)
  id!: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  lastName?: string

  @Field(() => String)
  email!: string
}

@InputType()
export class UpdateUserInput {
  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  lastName?: string

  @Field(() => String, { nullable: true })
  bio?: string

  @Field(() => [String], { nullable: true })
  skills?: string[]

  @Field(() => String, { nullable: true })
  portfolio?: string

  @Field(() => Number, { nullable: true })
  hourlyRate?: number

  @Field(() => String, { nullable: true })
  availability?: string

  @Field(() => String, { nullable: true })
  avatarUrl?: string
}
