import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { schemas } from '@/models'
import { ProjectRequestService } from '@/services'
import { checkPermission, getCurrentUser } from '@/utils'

const projectRequestService = new ProjectRequestService()

export const projectRequestResolvers = {
  Query: {
    projectRequests: async (_: any, { filter }: { filter?: any }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await projectRequestService.getProjectRequests(filter)
    },

    projectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()

      return await projectRequestService.getProjectRequestById(
        id,
        currentUser.id,
        currentUser.role
      )
    },

    myProjectRequests: async () => {
      const currentUser = await getCurrentUser()

      return await projectRequestService.getMyProjectRequests(
        currentUser.id,
        currentUser.role
      )
    },
  },

  Mutation: {
    createProjectRequest: async (_: any, { input }: { input: any }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'client')

      return await projectRequestService.createProjectRequest(
        input,
        currentUser.id
      )
    },

    updateProjectRequest: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const currentUser = await getCurrentUser()

      return await projectRequestService.updateProjectRequest(
        id,
        input,
        currentUser.id,
        currentUser.role
      )
    },

    approveProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await projectRequestService.approveProjectRequest(id)
    },

    rejectProjectRequest: async (_: any, { id }: { id: string }) => {
      const currentUser = await getCurrentUser()
      checkPermission(currentUser, 'admin')

      return await projectRequestService.rejectProjectRequest(id)
    },
  },

  ProjectRequest: {
    user: async (parent: any) => {
      return await db.query.users.findFirst({
        where: eq(schemas.users.id, parent.userId),
      })
    },

    reviewer: async (parent: any) => {
      if (!parent.reviewedBy) return null
      return await db.query.users.findFirst({
        where: eq(schemas.users.id, parent.reviewedBy),
      })
    },
  },
}
