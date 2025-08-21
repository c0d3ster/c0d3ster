import type { NextRequest } from 'next/server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { users } from '@/models/Schema'

// GET /api/users - Get current user profile
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/users')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      logger.info('User not found in database', { clerkId: userId })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    logger.debug('User profile retrieved', { clerkId: userId })
    return NextResponse.json(user)
  } catch (error) {
    logger.error('Error fetching user profile', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      clerkId: 'unknown',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/users POST')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, avatarUrl } = body

    // Derive email from Clerk server-side
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const primaryEmailId = clerkUser.primaryEmailAddressId
    const email =
      clerkUser.emailAddresses.find((e: any) => e.id === primaryEmailId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      logger.error('No email found for user', { clerkId: userId })
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    // Use atomic upsert to avoid race conditions
    const upserted = await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        avatarUrl: avatarUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          avatarUrl: avatarUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()

    logger.info('User profile upserted', { clerkId: userId, email })
    return NextResponse.json(upserted[0], { status: 201 })
  } catch (error) {
    logger.error('Error creating/updating user profile', {
      error,
      clerkId: 'unknown',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/users PUT')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, avatarUrl } = body

    const updatedUser = await db
      .update(users)
      .set({
        firstName,
        lastName,
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))
      .returning()

    if (updatedUser.length === 0) {
      logger.warn('User not found for update', { clerkId: userId })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    logger.info('User profile updated via PUT', { clerkId: userId })
    return NextResponse.json(updatedUser[0])
  } catch (error) {
    logger.error('Error updating user profile via PUT', {
      error,
      clerkId: 'unknown',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
