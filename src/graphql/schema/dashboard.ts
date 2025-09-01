import { Field, ObjectType } from 'type-graphql'

import { Project } from './project'
import { ProjectRequest } from './projectRequest'

@ObjectType('ProjectSummary')
export class ProjectSummary {
  @Field(() => Number)
  totalProjects!: number

  @Field(() => Number)
  activeProjects!: number

  @Field(() => Number)
  completedProjects!: number

  @Field(() => Number)
  pendingRequests!: number
}

@ObjectType('UserDashboard')
export class UserDashboard {
  @Field(() => [Project])
  projects!: Project[]

  @Field(() => [ProjectRequest])
  projectRequests!: ProjectRequest[]

  @Field(() => ProjectSummary)
  summary!: ProjectSummary

  @Field(() => [Project])
  availableProjects!: Project[]

  @Field(() => [Project])
  assignedProjects!: Project[]
}
