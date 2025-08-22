import type { NextRequest } from 'next/server'

import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projectRequests, users } from '@/models'
import { requireAdmin } from '@/utils'

// GET /api/admin/project-requests - Get all project requests (admin only)
export async function GET() {
  try {
    const adminUser = await requireAdmin()

    logger.info('Admin fetching all project requests', {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
    })

    // Get all project requests with user information
    const requests = await db
      .select({
        id: projectRequests.id,
        userId: projectRequests.userId,
        title: projectRequests.title,
        description: projectRequests.description,
        projectType: projectRequests.projectType,
        budget: projectRequests.budget,
        timeline: projectRequests.timeline,
        requirements: projectRequests.requirements,
        contactPreference: projectRequests.contactPreference,
        additionalInfo: projectRequests.additionalInfo,
        status: projectRequests.status,
        reviewedAt: projectRequests.reviewedAt,
        reviewedBy: projectRequests.reviewedBy,
        createdAt: projectRequests.createdAt,
        updatedAt: projectRequests.updatedAt,
        // User information
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(projectRequests)
      .leftJoin(users, eq(projectRequests.userId, users.id))
      .orderBy(desc(projectRequests.createdAt))

    return NextResponse.json({ requests })
  } catch (error) {
    logger.error('Error fetching project requests for admin', { error })

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/project-requests - Update project request status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const BodySchema = z.object({
      requestId: z.string().uuid(),
      status: z.enum(['requested', 'in_review', 'cancelled']),
    })

    const parse = BodySchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    const { requestId, status } = parse.data

    // Update the project request
    const [updatedRequest] = await db
      .update(projectRequests)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: adminUser.id,
        updatedAt: new Date(),
      })
      .where(eq(projectRequests.id, requestId))
      .returning()

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Project request not found' },
        { status: 404 }
      )
    }

    logger.info('Project request status updated by admin', {
      requestId,
      newStatus: status,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
    })

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    logger.error('Error updating project request status', { error })

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
