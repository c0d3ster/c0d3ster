import type { NextRequest } from 'next/server'

import { auth } from '@clerk/nextjs/server'
import { desc, eq, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projectCollaborators, projects, users } from '@/models/Schema'

// GET /api/projects - Get all projects for the authenticated user
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

    // Get projects where user is either the client or a collaborator
    const userProjects = await db
      .select({
        project: projects,
        collaboratorRole: projectCollaborators.role,
      })
      .from(projects)
      .leftJoin(
        projectCollaborators,
        eq(projectCollaborators.projectId, projects.id)
      )
      .where(
        or(
          eq(projects.clientId, user.id),
          eq(projectCollaborators.userId, user.id)
        )
      )
      .orderBy(desc(projects.updatedAt))

    // Remove duplicates and format response (O(n))
    type ProjectWithRole = typeof projects.$inferSelect & {
      userRole: 'client' | 'admin' | 'editor' | 'viewer'
    }
    const rank: Record<ProjectWithRole['userRole'], number> = {
      client: 4,
      admin: 3,
      editor: 2,
      viewer: 1,
    }
    const map = new Map<string, ProjectWithRole>()
    for (const item of userProjects) {
      const computedRole =
        item.project.clientId === user.id
          ? 'client'
          : ((item.collaboratorRole as ProjectWithRole['userRole']) ?? 'viewer')
      const prev = map.get(item.project.id)
      if (!prev || rank[computedRole] > rank[prev.userRole]) {
        map.set(item.project.id, { ...item.project, userRole: computedRole })
      }
    }
    const uniqueProjects = Array.from(map.values())

    return NextResponse.json({ projects: uniqueProjects })
  } catch (error) {
    logger.error('Error fetching projects', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project (admin only)
export async function POST(request: NextRequest) {
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

    // TODO: Add admin role check here when user roles are implemented
    // For now, you'll need to manually verify this is an admin request

    const body = await request.json()
    const {
      requestId,
      clientId,
      title,
      description,
      projectType,
      budget,
      startDate,
      estimatedCompletionDate,
      requirements,
      techStack,
      priority = 'medium',
    } = body

    // Validate required fields
    if (!clientId || !title || !description || !projectType) {
      return NextResponse.json(
        {
          error: 'Client ID, title, description, and project type are required',
        },
        { status: 400 }
      )
    }

    // Create the project
    const [newProject] = await db
      .insert(projects)
      .values({
        requestId: requestId || null,
        clientId,
        title,
        description,
        projectType,
        budget: budget ? String(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedCompletionDate: estimatedCompletionDate
          ? new Date(estimatedCompletionDate)
          : null,
        requirements,
        techStack,
        priority,
        status: 'approved',
        progressPercentage: 0,
      })
      .returning()

    logger.info('Project created', {
      projectId: newProject?.id,
      clientId,
      title,
    })

    return NextResponse.json({ project: newProject }, { status: 201 })
  } catch (error) {
    logger.error('Error creating project', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
