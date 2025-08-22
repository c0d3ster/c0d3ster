import type { NextRequest } from 'next/server'

import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { projectRequests, projects } from '@/models'
import { requireAdmin } from '@/utils'

type RouteParams = {
  params: Promise<{ id: string }>
}

// POST /api/admin/project-requests/[id]/approve - Convert project request to full project
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: requestId } = await params

  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const BodySchema = z.object({
      startDate: z.string().optional(),
      estimatedCompletionDate: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      techStack: z.array(z.string()).optional(),
      budget: z.number().optional(),
      internalNotes: z.string().optional(),
    })

    const parse = BodySchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    const {
      startDate,
      estimatedCompletionDate,
      priority,
      techStack,
      budget,
      internalNotes,
    } = parse.data

    // Get the project request
    const projectRequest = await db.query.projectRequests.findFirst({
      where: eq(projectRequests.id, requestId),
    })

    if (!projectRequest) {
      return NextResponse.json(
        { error: 'Project request not found' },
        { status: 404 }
      )
    }

    if (projectRequest.status !== 'in_review') {
      return NextResponse.json(
        { error: 'Project request must be in review to approve' },
        { status: 400 }
      )
    }

    // Start transaction to create project and update request
    const result = await db.transaction(async (tx) => {
      // Atomically transition request to approved only if currently in_review
      const updatedReq = await tx
        .update(projectRequests)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: adminUser.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectRequests.id, requestId),
            eq(projectRequests.status, 'in_review')
          )
        )
        .returning({ id: projectRequests.id })

      if (updatedReq.length === 0) {
        throw new Error('Conflict: request already approved or not in review')
      }

      // Create the project
      const [newProject] = await tx
        .insert(projects)
        .values({
          requestId,
          clientId: projectRequest.userId,
          title: projectRequest.title,
          description: projectRequest.description,
          projectType: projectRequest.projectType,
          budget: budget ? String(budget) : projectRequest.budget,
          startDate: startDate ? new Date(startDate) : null,
          estimatedCompletionDate: estimatedCompletionDate
            ? new Date(estimatedCompletionDate)
            : null,
          requirements: projectRequest.requirements,
          techStack: techStack || [],
          priority,
          status: 'approved',
          progressPercentage: 0,
          internalNotes,
        })
        .returning()

      return newProject
    })

    logger.info('Project request approved and converted to project', {
      requestId,
      projectId: result?.id,
      adminId: adminUser.id,
      clientId: projectRequest.userId,
      title: projectRequest.title,
    })

    return NextResponse.json({ project: result }, { status: 201 })
  } catch (error) {
    logger.error('Error approving project request', {
      error,
      requestId,
    })

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (error.message.startsWith('Conflict:')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
