import { Field, ObjectType } from 'type-graphql'

import { ProjectDisplay } from './project'
import { ProjectRequestDisplay } from './projectRequest'

@ObjectType()
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

@ObjectType()
export class UserDashboard {
  @Field(() => [ProjectDisplay])
  projects!: ProjectDisplay[]

  @Field(() => [ProjectRequestDisplay])
  projectRequests!: ProjectRequestDisplay[]

  @Field(() => ProjectSummary)
  summary!: ProjectSummary

  @Field(() => [ProjectDisplay])
  availableProjects!: ProjectDisplay[]

  @Field(() => [ProjectDisplay])
  assignedProjects!: ProjectDisplay[]
}
