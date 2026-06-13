import 'reflect-metadata'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { users } from '@/models'

export const GET = async (): Promise<NextResponse> => {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL))
  }

  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    const email = clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      logger.warn('sync-user: no email on Clerk user', { userId })
      return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL))
    }

    await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
      })
      .onConflictDoNothing({ target: users.clerkId })

    logger.info('sync-user: user synced', { userId })
  } catch (error) {
    logger.error('sync-user: failed to sync user', { error, userId })
  }

  return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL))
}
