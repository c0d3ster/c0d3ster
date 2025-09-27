import { GraphQLError } from 'graphql'
import { FieldResolver, Resolver, Root } from 'type-graphql'

import type { ProjectRecord, ProjectRequestRecord } from '@/models'
import type {
  ProjectRequestService,
  ProjectService,
  UserService,
} from '@/services'

import { ProjectStatus } from '@/graphql/generated/graphql'
import {
  Project,
  ProjectRequest,
  ProjectSummary,
  UserDashboard,
} from '@/graphql/schema'
import { isDeveloperOrHigherRole } from '@/utils'

// Type for the dashboard parent object
type DashboardParent = {
  userId: string
}

@Resolver(() => UserDashboard)
export class DashboardResolver {
  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private projectRequestService: ProjectRequestService
  ) {}

  @FieldResolver(() => [Project])
  async projects(@Root() parent: DashboardParent) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return await this.projectService.getMyProjects(
      currentUser.id,
      currentUser.role
    )
  }

  @FieldResolver(() => [ProjectRequest])
  async projectRequests(@Root() parent: DashboardParent) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return await this.projectRequestService.getMyProjectRequests(
      currentUser.id,
      currentUser.role
    )
  }

  @FieldResolver(() => ProjectSummary)
  async summary(@Root() parent: DashboardParent) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const userProjects = await this.projectService.getMyProjects(
      currentUser.id,
      currentUser.role
    )
    const userRequests = await this.projectRequestService.getMyProjectRequests(
      currentUser.id,
      currentUser.role
    )

    const totalProjects = userProjects.length
    const activeProjects = userProjects.filter((p: ProjectRecord) =>
      [
        ProjectStatus.InProgress,
        ProjectStatus.InTesting,
        ProjectStatus.ReadyForLaunch,
      ].includes(p.status as ProjectStatus)
    ).length
    const completedProjects = userProjects.filter((p: ProjectRecord) =>
      [ProjectStatus.Completed].includes(p.status as ProjectStatus)
    ).length
    const totalRequests = userRequests.length
    const pendingReviewRequests = userRequests.filter(
      (r: ProjectRequestRecord) =>
        [ProjectStatus.Requested].includes(r.status as ProjectStatus)
    ).length
    const inReviewRequests = userRequests.filter((r: ProjectRequestRecord) =>
      [ProjectStatus.InReview].includes(r.status as ProjectStatus)
    ).length

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalRequests,
      pendingReviewRequests,
      inReviewRequests,
    }
  }

  @FieldResolver(() => [Project])
  async availableProjects(@Root() parent: DashboardParent) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Only developers can see available projects
    if (!isDeveloperOrHigherRole(currentUser.role)) {
      return []
    }

    const availableProjects = await this.projectService.getAvailableProjects()
    return availableProjects
  }

  @FieldResolver(() => [Project])
  async assignedProjects(@Root() parent: DashboardParent) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Only developers can have assigned projects
    if (!isDeveloperOrHigherRole(currentUser.role)) {
      return []
    }

    const assignedProjects = await this.projectService.getAssignedProjects(
      currentUser.id
    )
    return assignedProjects
  }
}
