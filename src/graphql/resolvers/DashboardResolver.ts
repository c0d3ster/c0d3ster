import { GraphQLError } from 'graphql'
import { FieldResolver, Resolver, Root } from 'type-graphql'

import type {
  ProjectRequestService,
  ProjectService,
  UserService,
} from '@/services'

import {
  ProjectRequestDisplay,
  ProjectSummary,
  UserDashboard,
} from '@/graphql/schema'
import { isDeveloperOrHigherRole } from '@/utils'

@Resolver(() => UserDashboard)
export class DashboardResolver {
  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private projectRequestService: ProjectRequestService
  ) {}

  @FieldResolver(() => [String])
  async projects(@Root() parent: any) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const userProjects = await this.projectService.getProjects(
      undefined,
      currentUser.id
    )
    return userProjects.map((p: any) => p.id)
  }

  @FieldResolver(() => [ProjectRequestDisplay])
  async projectRequests(@Root() parent: any) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return await this.projectRequestService.getProjectRequestsByUserId(
      currentUser.id
    )
  }

  @FieldResolver(() => ProjectSummary)
  async summary(@Root() parent: any) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    if (parent.userId !== currentUser.id) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const userProjects = await this.projectService.getProjects(
      undefined,
      currentUser.id
    )
    const userRequests =
      await this.projectRequestService.getProjectRequestsByUserId(
        currentUser.id
      )

    const totalProjects = userProjects.length
    const activeProjects = userProjects.filter((p: any) =>
      ['in_progress', 'in_testing', 'ready_for_launch'].includes(p.status)
    ).length
    const completedProjects = userProjects.filter((p: any) =>
      ['completed', 'live'].includes(p.status)
    ).length
    const pendingRequests = userRequests.filter((r: any) =>
      ['pending', 'in_review'].includes(r.status)
    ).length

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      pendingRequests,
    }
  }

  @FieldResolver(() => [String])
  async availableProjects(@Root() parent: any) {
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
    return availableProjects.map((p: any) => p.id)
  }

  @FieldResolver(() => [String])
  async assignedProjects(@Root() parent: any) {
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
    return assignedProjects.map((p: any) => p.id)
  }
}
