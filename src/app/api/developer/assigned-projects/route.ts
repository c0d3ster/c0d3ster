import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projects, users } from '@/models'
import { ProjectItemType } from '@/types'
import { isDeveloperOrHigher, requireAuth } from '@/utils'

// GET /api/developer/assigned-projects - Get projects assigned to the developer
export async function GET() {
  try {
    const user = await requireAuth()

    if (!isDeveloperOrHigher(user)) {
      logger.warn('Non-developer tried to access assigned projects', {
        userId: user.id,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get projects where user is the assigned developer
    const assignedProjects = await db
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
        // Client information
        clientEmail: users.email,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
      })
      .from(projects)
      .leftJoin(users, eq(projects.clientId, users.id))
      .where(eq(projects.developerId, user.id))
      .orderBy(desc(projects.updatedAt))

    // Add type and userRole fields for consistency with my-projects
    const projectsWithType = assignedProjects.map((project) => ({
      ...project,
      type: ProjectItemType.PROJECT,
      userRole: 'developer' as const,
    }))

    logger.info('Fetched assigned projects for developer', {
      userId: user.id,
      projectCount: assignedProjects.length,
    })

    return NextResponse.json({ projects: projectsWithType })
  } catch (error) {
    logger.error('Error fetching assigned projects', { error })

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
