import type { NextRequest } from 'next/server'

import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projects } from '@/models'
import { isDeveloperOrHigher, requireAuth } from '@/utils'

type RouteParams = {
  params: Promise<{ id: string }>
}

// PATCH /api/developer/available-projects/[id]/assign - Assign developer to project
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params

  try {
    const user = await requireAuth()

    if (!isDeveloperOrHigher(user)) {
      logger.warn('Non-developer tried to assign themselves to project', {
        userId: user.id,
        projectId,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if project exists and is available
    const existingProject = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.status, 'approved'),
          isNull(projects.developerId)
        )
      )
      .limit(1)

    if (existingProject.length === 0) {
      logger.warn('Project not found or not available for assignment', {
        userId: user.id,
        projectId,
      })
      return NextResponse.json(
        { error: 'Project not found or not available' },
        { status: 404 }
      )
    }

    // Assign developer to project and update status (atomic guard)
    const updatedProject = await db
      .update(projects)
      .set({
        developerId: user.id,
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.status, 'approved'),
          isNull(projects.developerId)
        )
      )
      .returning()

    if (updatedProject.length === 0) {
      // Another developer likely claimed it first
      return NextResponse.json(
        { error: 'Project already assigned or not in an assignable state' },
        { status: 409 }
      )
    }

    logger.info('Developer assigned to project', {
      userId: user.id,
      projectId,
      projectTitle: existingProject[0]?.title,
    })

    return NextResponse.json(
      {
        project: updatedProject[0],
        message: 'Successfully assigned to project',
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Error assigning developer to project', { error, projectId })

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
