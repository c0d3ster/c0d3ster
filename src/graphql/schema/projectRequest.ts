import { Field, ID, InputType, ObjectType } from 'type-graphql'

import { ProjectType } from './project'
import { DisplayUser } from './user'

@ObjectType()
export class ProjectRequestDisplay {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  projectName!: string

  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String)
  description!: string

  @Field(() => ProjectType)
  projectType!: ProjectType

  @Field(() => Number, { nullable: true })
  budget?: number

  @Field(() => String, { nullable: true })
  timeline?: string

  @Field(() => String, { nullable: true })
  requirements?: string

  @Field(() => String, { nullable: true })
  additionalInfo?: string

  @Field(() => String)
  status!: string

  @Field(() => String)
  createdAt!: string

  @Field(() => ID, { nullable: true })
  userId?: string

  // This will be resolved by field resolvers
  @Field(() => DisplayUser, { nullable: true })
  user?: DisplayUser
}

@ObjectType()
export class ProjectRequest {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  projectName!: string

  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String)
  description!: string

  @Field(() => ProjectType)
  projectType!: ProjectType

  @Field(() => Number, { nullable: true })
  budget?: number

  @Field(() => String, { nullable: true })
  timeline?: string

  @Field(() => String, { nullable: true })
  requirements?: string

  @Field(() => String, { nullable: true })
  contactPreference?: string

  @Field(() => String, { nullable: true })
  additionalInfo?: string

  @Field(() => String)
  status!: string

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  updatedAt!: string

  @Field(() => ID, { nullable: true })
  userId?: string

  @Field(() => ID, { nullable: true })
  reviewerId?: string

  // These will be resolved by field resolvers
  @Field(() => DisplayUser, { nullable: true })
  user?: DisplayUser

  @Field(() => DisplayUser, { nullable: true })
  reviewer?: DisplayUser
}

@InputType()
export class CreateProjectRequestInput {
  @Field(() => String)
  projectName!: string

  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String)
  description!: string

  @Field(() => ProjectType)
  projectType!: ProjectType

  @Field(() => Number, { nullable: true })
  budget?: number

  @Field(() => String, { nullable: true })
  timeline?: string

  @Field(() => String, { nullable: true })
  requirements?: string

  @Field(() => String, { nullable: true })
  contactPreference?: string

  @Field(() => String, { nullable: true })
  additionalInfo?: string
}
