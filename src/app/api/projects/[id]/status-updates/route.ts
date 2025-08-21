import type { NextRequest } from 'next/server'

import { auth } from '@clerk/nextjs/server'
import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projectStatusUpdates, projects, users } from '@/models/Schema'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/status-updates - Get status updates for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
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
          ? eq(projectStatusUpdates.projectId, projectId)
          : eq(projectStatusUpdates.projectId, projectId)
      )
      .orderBy(desc(projectStatusUpdates.createdAt))

    // Filter client-visible updates if user is a client
    const filteredUpdates = isClient
      ? updates.filter((update) => update.isClientVisible)
      : updates

    return NextResponse.json({ updates: filteredUpdates })
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

    // TODO: Add admin role check here when user roles are implemented
    // For now, only allow project updates from admin users

    const body = await request.json()
    const {
      newStatus,
      progressPercentage,
      updateMessage,
      isClientVisible = true,
    } = body

    // Validate required fields
    if (!newStatus || !updateMessage) {
      return NextResponse.json(
        { error: 'New status and update message are required' },
        { status: 400 }
      )
    }

    // Get current project to capture old status
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create the status update
    const [statusUpdate] = await db
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

    // Update the project status and progress
    await db
      .update(projects)
      .set({
        status: newStatus,
        progressPercentage: progressPercentage || project.progressPercentage,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

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
