import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projects, users } from '@/models'
import { isDeveloperOrHigher, requireAuth } from '@/utils'

// GET /api/developer/available-projects - Get approved projects available for developer assignment
export async function GET() {
  try {
    const user = await requireAuth()

    if (!isDeveloperOrHigher(user)) {
      logger.warn('Non-developer tried to access available projects', {
        userId: user.id,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get approved projects that don't have a developer assigned yet
    const availableProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        projectType: projects.projectType,
        budget: projects.budget,
        priority: projects.priority,
        techStack: projects.techStack,
        repositoryUrl: projects.repositoryUrl,
        startDate: projects.startDate,
        estimatedCompletionDate: projects.estimatedCompletionDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        // Client information
        clientEmail: users.email,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
      })
      .from(projects)
      .leftJoin(users, eq(projects.clientId, users.id))
      .where(
        and(
          eq(projects.status, 'approved'),
          isNull(projects.developerId) // No developer assigned yet
        )
      )
      .orderBy(projects.priority, projects.createdAt)

    logger.info('Fetched available projects for developer', {
      userId: user.id,
      projectCount: availableProjects.length,
    })

    return NextResponse.json({ projects: availableProjects })
  } catch (error) {
    logger.error('Error fetching available projects', { error })

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
