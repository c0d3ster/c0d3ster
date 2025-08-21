import type { NextRequest } from 'next/server'

import { auth } from '@clerk/nextjs/server'
import { and, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projectStatusEnum } from '@/models/enums'
import { projects, projectStatusUpdates, users } from '@/models/Schema'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/status-updates - Get status updates for a project
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkId } = await auth()
    const { id: projectId } = await params

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

    // Verify user has access to this project
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is the client or admin (for now, just check if they're the client)
    const isClient = project.clientId === user.id
    // TODO: extend to collaborators/admins when roles are available
    const hasAccess = isClient
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get status updates, filtering by client visibility if needed
    const updates = await db
      .select({
        id: projectStatusUpdates.id,
        oldStatus: projectStatusUpdates.oldStatus,
        newStatus: projectStatusUpdates.newStatus,
        progressPercentage: projectStatusUpdates.progressPercentage,
        updateMessage: projectStatusUpdates.updateMessage,
        isClientVisible: projectStatusUpdates.isClientVisible,
        createdAt: projectStatusUpdates.createdAt,
        updatedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(projectStatusUpdates)
      .leftJoin(users, eq(projectStatusUpdates.updatedBy, users.id))
      .where(
        isClient
          ? and(
              eq(projectStatusUpdates.projectId, projectId),
              eq(projectStatusUpdates.isClientVisible, true)
            )
          : eq(projectStatusUpdates.projectId, projectId)
      )
      .orderBy(desc(projectStatusUpdates.createdAt))

    return NextResponse.json({ updates })
  } catch (error) {
    logger.error('Error fetching project status updates', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/status-updates - Create a new status update
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkId } = await auth()
    const { id: projectId } = await params

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

    // TODO: Extend to admins/collaborators when roles are implemented

    const body = await request.json()
    const BodySchema = z.object({
      newStatus: z.enum(projectStatusEnum.enumValues),
      progressPercentage: z.number().int().min(0).max(100).optional(),
      updateMessage: z.string().min(1),
      isClientVisible: z.boolean().optional().default(true),
    })
    const parse = BodySchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }
    const { newStatus, progressPercentage, updateMessage, isClientVisible } =
      parse.data

    // Get current project to capture old status
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Enforce authorization (MVP): only the project client can update
    const isClient = project.clientId === user.id
    if (!isClient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create the status update and mutate project atomically
    const statusUpdate = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(projectStatusUpdates)
        .values({
          projectId,
          oldStatus: project.status,
          newStatus,
          progressPercentage,
          updateMessage,
          isClientVisible,
          updatedBy: user.id,
        })
        .returning()

      await tx
        .update(projects)
        .set({
          status: newStatus,
          progressPercentage: progressPercentage ?? project.progressPercentage,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))

      return inserted
    })

    logger.info('Project status updated', {
      projectId,
      oldStatus: project.status,
      newStatus,
      updatedBy: user.id,
    })

    return NextResponse.json({ statusUpdate }, { status: 201 })
  } catch (error) {
    logger.error('Error creating project status update', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
