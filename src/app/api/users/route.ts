import type { NextRequest } from 'next/server'

import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { users } from '@/models/Schema'

// GET /api/users - Get current user profile
export async function GET() {
  try {
    console.warn('=== SIMPLE LOG TEST ===')
    logger.info('GET /api/users called')

    const { userId } = await auth()
    logger.info('Auth result', {
      userId,
      userIdType: typeof userId,
      userIdLength: userId?.length,
    })

    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/users')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Attempting database query', {
      userId,
      queryClause: `users.clerkId = '${userId}'`,
    })
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })
    logger.info('Database query result', {
      userFound: !!user,
      foundUserId: user?.clerkId,
      foundEmail: user?.email,
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
    const { email, firstName, lastName, avatarUrl } = body

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (existingUser) {
      // Update existing user
      const updatedUser = await db
        .update(users)
        .set({
          email,
          firstName,
          lastName,
          avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId))
        .returning()

      logger.info('User profile updated', { clerkId: userId, email })
      return NextResponse.json(updatedUser[0])
    } else {
      // Create new user
      const newUser = await db
        .insert(users)
        .values({
          clerkId: userId,
          email,
          firstName,
          lastName,
          avatarUrl,
        })
        .returning()

      logger.info('New user profile created', { clerkId: userId, email })
      return NextResponse.json(newUser[0], { status: 201 })
    }
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
