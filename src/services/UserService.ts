import { desc, eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'

export class UserService {
  async getCurrentUser(clerkId: string) {
    const user = await db.query.users.findFirst({
      where: eq(schemas.users.clerkId, clerkId),
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  async getUserById(id: string) {
    return await db.query.users.findFirst({
      where: eq(schemas.users.id, id),
    })
  }

  async getUsers(filter?: { role?: string; email?: string }) {
    let whereClause
    if (filter) {
      const conditions = []
      if (filter.role) {
        conditions.push(eq(schemas.users.role, filter.role as any))
      }
      if (filter.email) {
        conditions.push(eq(schemas.users.email, filter.email))
      }
      if (conditions.length > 0) {
        whereClause =
          conditions.length === 1
            ? conditions[0]
            : conditions.reduce((acc, condition) => acc && condition)
      }
    }

    return await db.query.users.findMany({
      where: whereClause,
      orderBy: [desc(schemas.users.createdAt)],
    })
  }

  async updateUser(id: string, input: any) {
    const [updatedUser] = await db
      .update(schemas.users)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(schemas.users.id, id))
      .returning()

    logger.info(`User updated: ${id}`)
    return updatedUser
  }

  async getUserProjects(userId: string) {
    return await db.query.projects.findMany({
      where: eq(schemas.projects.clientId, userId),
    })
  }

  async getUserProjectRequests(userId: string) {
    return await db.query.projectRequests.findMany({
      where: eq(schemas.projectRequests.userId, userId),
    })
  }
}
