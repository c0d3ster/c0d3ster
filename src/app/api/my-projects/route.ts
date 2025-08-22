import { auth } from '@clerk/nextjs/server'
import { desc, eq, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import {
  projectCollaborators,
  projectRequests,
  projects,
  users,
} from '@/models/Schema'
import { ProjectItemType } from '@/types'

// GET /api/my-projects - Get all projects and requests for the authenticated user
export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get project requests
    const requests = await db
      .select({
        id: projectRequests.id,
        title: projectRequests.title,
        description: projectRequests.description,
        projectType: projectRequests.projectType,
        budget: projectRequests.budget,
        timeline: projectRequests.timeline,
        status: projectRequests.status,
        createdAt: projectRequests.createdAt,
        updatedAt: projectRequests.updatedAt,
      })
      .from(projectRequests)
      .where(eq(projectRequests.userId, user.id))
      .orderBy(desc(projectRequests.createdAt))

    // Get approved projects where user is client or collaborator
    const userProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        projectType: projects.projectType,
        budget: projects.budget,
        status: projects.status,
        priority: projects.priority,
        progressPercentage: projects.progressPercentage,
        startDate: projects.startDate,
        estimatedCompletionDate: projects.estimatedCompletionDate,
        actualCompletionDate: projects.actualCompletionDate,
        liveUrl: projects.liveUrl,
        stagingUrl: projects.stagingUrl,
        repositoryUrl: projects.repositoryUrl,
        techStack: projects.techStack,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        collaboratorRole: projectCollaborators.role,
        clientId: projects.clientId,
        // Client information
        clientEmail: users.email,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        developerId: projects.developerId,
      })
      .from(projects)
      .leftJoin(
        projectCollaborators,
        eq(projectCollaborators.projectId, projects.id)
      )
      .leftJoin(users, eq(projects.clientId, users.id))
      .where(
        or(
          eq(projects.clientId, user.id),
          eq(projectCollaborators.userId, user.id)
        )
      )
      .orderBy(desc(projects.updatedAt))

    // Remove duplicates from projects (in case user is both client and collaborator)
    const uniqueProjects = userProjects.reduce((acc, item) => {
      const existingProject = acc.find((p) => p.id === item.id)
      if (!existingProject) {
        acc.push({
          ...item,
          userRole:
            item.clientId === user.id
              ? 'client'
              : item.developerId === user.id
                ? 'developer'
                : item.collaboratorRole || 'viewer',
        })
      }
      return acc
    }, [] as any[])

    // Add type field and combine requests and projects
    const requestsWithType = requests.map((r) => ({
      ...r,
      type: ProjectItemType.REQUEST,
    }))
    const projectsWithType = uniqueProjects.map((p) => ({
      ...p,
      type: ProjectItemType.PROJECT,
    }))

    const allItems = [...requestsWithType, ...projectsWithType].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    )

    return NextResponse.json({
      items: allItems,
      summary: {
        totalRequests: requests.length,
        totalProjects: uniqueProjects.length,
        pendingRequests: requests.filter((r) =>
          ['requested', 'in_review'].includes(r.status)
        ).length,
        activeProjects: uniqueProjects.filter((p) =>
          ['in_progress', 'in_testing'].includes(p.status)
        ).length,
      },
    })
  } catch (error) {
    logger.error('Error fetching user projects', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
