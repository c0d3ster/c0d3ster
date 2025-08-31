import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

import { DisplayUser } from './user'

export enum ProjectStatus {
  Requested = 'requested',
  InReview = 'in_review',
  Approved = 'approved',
  InProgress = 'in_progress',
  InTesting = 'in_testing',
  ReadyForLaunch = 'ready_for_launch',
  Live = 'live',
  Completed = 'completed',
  OnHold = 'on_hold',
  Cancelled = 'cancelled',
}

export enum ProjectType {
  Website = 'website',
  WebApp = 'web_app',
  MobileApp = 'mobile_app',
  ECommerce = 'e_commerce',
  Api = 'api',
  Maintenance = 'maintenance',
  Consultation = 'consultation',
  Other = 'other',
}

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
  description: 'Status of a project',
})

registerEnumType(ProjectType, {
  name: 'ProjectType',
  description: 'Type of project',
})

@ObjectType()
export class ProjectDisplay {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  projectName!: string

  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String, { nullable: true })
  overview?: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => [String], { nullable: true })
  techStack?: string[]

  @Field(() => ProjectStatus)
  status!: ProjectStatus

  @Field(() => String, { nullable: true })
  logo?: string

  @Field(() => String, { nullable: true })
  liveUrl?: string

  @Field(() => String, { nullable: true })
  repositoryUrl?: string

  @Field(() => String, { nullable: true })
  stagingUrl?: string

  @Field(() => Boolean)
  featured!: boolean

  @Field(() => String)
  createdAt!: string

  @Field(() => String, { nullable: true })
  updatedAt?: string

  @Field(() => ProjectType)
  projectType!: ProjectType

  @Field(() => Number, { nullable: true })
  budget?: number

  @Field(() => Number, { nullable: true })
  progressPercentage?: number

  @Field(() => String, { nullable: true })
  startDate?: string

  @Field(() => String, { nullable: true })
  estimatedCompletionDate?: string

  @Field(() => String, { nullable: true })
  actualCompletionDate?: string
}

@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  projectName!: string

  @Field(() => String)
  description!: string

  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String, { nullable: true })
  overview?: string

  @Field(() => ProjectType)
  projectType!: ProjectType

  @Field(() => Number, { nullable: true })
  budget?: number

  @Field(() => String, { nullable: true })
  requirements?: string

  @Field(() => [String], { nullable: true })
  techStack?: string[]

  @Field(() => ProjectStatus)
  status!: ProjectStatus

  @Field(() => Number, { nullable: true })
  progressPercentage?: number

  @Field(() => String, { nullable: true })
  priority?: string

  @Field(() => String, { nullable: true })
  startDate?: string

  @Field(() => String, { nullable: true })
  estimatedCompletionDate?: string

  @Field(() => String, { nullable: true })
  actualCompletionDate?: string

  @Field(() => String, { nullable: true })
  repositoryUrl?: string

  @Field(() => String, { nullable: true })
  liveUrl?: string

  @Field(() => String, { nullable: true })
  stagingUrl?: string

  @Field(() => Boolean)
  featured!: boolean

  @Field(() => String, { nullable: true })
  logo?: string

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  updatedAt!: string

  @Field(() => ID)
  clientId!: string

  @Field(() => ID, { nullable: true })
  developerId?: string

  @Field(() => ID, { nullable: true })
  requestId?: string

  // These will be resolved by field resolvers
  @Field(() => DisplayUser, { nullable: true })
  client?: DisplayUser

  @Field(() => DisplayUser, { nullable: true })
  developer?: DisplayUser

  @Field(() => String, { nullable: true })
  projectRequest?: string

  @Field(() => [String], { nullable: true })
  statusUpdates?: string[]

  @Field(() => [ProjectCollaborator], { nullable: true })
  collaborators?: ProjectCollaborator[]
}

@ObjectType()
export class ProjectStatusUpdate {
  @Field(() => ID)
  id!: string

  @Field(() => ID, { nullable: true })
  projectId?: string

  @Field(() => ProjectStatus, { nullable: true })
  oldStatus?: ProjectStatus

  @Field(() => ProjectStatus)
  newStatus!: ProjectStatus

  @Field(() => Number, { nullable: true })
  progressPercentage?: number

  @Field(() => String)
  updateMessage!: string

  @Field(() => String)
  createdAt!: string

  @Field(() => String, { nullable: true })
  updatedAt?: string

  @Field(() => Boolean)
  isClientVisible!: boolean

  @Field(() => ID, { nullable: true })
  updatedById?: string

  @Field(() => String, { nullable: true })
  updatedBy?: string
}

@ObjectType()
export class ProjectCollaborator {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  role!: string

  @Field(() => String)
  joinedAt!: string

  @Field(() => ID, { nullable: true })
  userId?: string

  // This will be resolved by field resolvers
  @Field(() => DisplayUser, { nullable: true })
  user?: DisplayUser
}

@InputType()
export class CreateProjectInput {
  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String)
  projectName!: string

  @Field(() => String)
  description!: string

  @Field(() => ProjectType)
  projectType!: ProjectType

  @Field(() => Number, { nullable: true })
  budget?: number

  @Field(() => String, { nullable: true })
  requirements?: string

  @Field(() => [String], { nullable: true })
  techStack?: string[]

  @Field(() => ProjectStatus)
  status!: ProjectStatus

  @Field(() => Number, { nullable: true })
  progressPercentage?: number

  @Field(() => String, { nullable: true })
  startDate?: string

  @Field(() => String, { nullable: true })
  estimatedCompletionDate?: string

  @Field(() => String, { nullable: true })
  actualCompletionDate?: string
}

@InputType()
export class UpdateProjectInput {
  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String, { nullable: true })
  projectName?: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => ProjectType, { nullable: true })
  projectType?: ProjectType

  @Field(() => Number, { nullable: true })
  budget?: number

  @Field(() => String, { nullable: true })
  requirements?: string

  @Field(() => [String], { nullable: true })
  techStack?: string[]

  @Field(() => ProjectStatus, { nullable: true })
  status?: ProjectStatus

  @Field(() => Number, { nullable: true })
  progressPercentage?: number

  @Field(() => String, { nullable: true })
  startDate?: string

  @Field(() => String, { nullable: true })
  estimatedCompletionDate?: string

  @Field(() => String, { nullable: true })
  actualCompletionDate?: string

  @Field(() => Boolean, { nullable: true })
  featured?: boolean

  @Field(() => String, { nullable: true })
  logo?: string
}

@InputType()
export class ProjectFilter {
  @Field(() => ProjectStatus, { nullable: true })
  status?: ProjectStatus

  @Field(() => ProjectType, { nullable: true })
  projectType?: ProjectType

  @Field(() => String, { nullable: true })
  priority?: string

  @Field(() => String, { nullable: true })
  clientId?: string

  @Field(() => String, { nullable: true })
  developerId?: string
}
