import { Field, ID, InputType, ObjectType } from 'type-graphql'

import { ProjectStatus, ProjectType } from './project'
import { User } from './user'

@ObjectType('ProjectRequest')
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

  @Field(() => ProjectStatus)
  status!: ProjectStatus

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  updatedAt!: string

  @Field(() => ID, { nullable: true })
  userId?: string

  @Field(() => ID, { nullable: true })
  reviewerId?: string

  // These will be resolved by field resolvers
  @Field(() => User, { nullable: true })
  user?: User

  @Field(() => User, { nullable: true })
  reviewer?: User
}

@InputType('CreateProjectRequestInput')
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

@InputType('ProjectRequestFilter')
export class ProjectRequestFilter {
  @Field(() => String, { nullable: true })
  status?: string

  @Field(() => ProjectType, { nullable: true })
  projectType?: ProjectType

  @Field(() => String, { nullable: true })
  userId?: string

  @Field(() => String, { nullable: true })
  reviewerId?: string

  @Field(() => String, { nullable: true })
  projectName?: string
}
