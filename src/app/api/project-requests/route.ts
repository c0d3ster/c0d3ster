import type { NextRequest } from 'next/server'

import { auth } from '@clerk/nextjs/server'
import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projectRequests, users } from '@/models/Schema'

// GET /api/project-requests - Get all project requests for the authenticated user
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

    // Get all project requests for this user
    const requests = await db
      .select()
      .from(projectRequests)
      .where(eq(projectRequests.userId, user.id))
      .orderBy(desc(projectRequests.createdAt))

    return NextResponse.json({ requests })
  } catch (error) {
    logger.error('Error fetching project requests', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/project-requests - Create a new project request
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

    const body = await request.json()
    const {
      title,
      description,
      projectType,
      budget,
      timeline,
      requirements,
      contactPreference,
      additionalInfo,
    } = body

    // Validate required fields
    if (!title || !description || !projectType) {
      return NextResponse.json(
        { error: 'Title, description, and project type are required' },
        { status: 400 }
      )
    }

    // Create the project request
    const [newRequest] = await db
      .insert(projectRequests)
      .values({
        userId: user.id,
        title,
        description,
        projectType,
        budget: budget ? String(budget) : null,
        timeline,
        requirements,
        contactPreference,
        additionalInfo,
        status: 'requested',
      })
      .returning()

    logger.info('Project request created', {
      requestId: newRequest?.id,
      userId: user.id,
      title,
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    logger.error('Error creating project request', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
