import type { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { users } from '@/models/Schema'

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET not configured')
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env'
    )
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn('Webhook missing required headers', {
      svix_id,
      svix_timestamp,
      svix_signature,
    })
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await request.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    logger.error('Webhook verification failed', { error: err, svix_id })
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Get the ID and type
  const { id } = evt.data
  const eventType = evt.type

  logger.info('Webhook received', { id, eventType, body })

  if (eventType === 'user.created') {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = evt.data

    const email = email_addresses?.[0]?.email_address

    if (email) {
      try {
        await db.insert(users).values({
          clerkId,
          email,
          firstName: first_name || null,
          lastName: last_name || null,
          avatarUrl: image_url || null,
        })
        logger.info('User created in database', { clerkId })
      } catch (error) {
        logger.error('Error creating user in database', { error, clerkId })
      }
    }
  }

  if (eventType === 'user.updated') {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = evt.data

    const email = email_addresses?.[0]?.email_address

    if (email) {
      try {
        await db
          .update(users)
          .set({
            email,
            firstName: first_name || null,
            lastName: last_name || null,
            avatarUrl: image_url || null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId))
        logger.info('User updated in database', { clerkId })
      } catch (error) {
        logger.error('Error updating user in database', { error, clerkId })
      }
    }
  }

  if (eventType === 'user.deleted') {
    const { id: clerkId } = evt.data

    try {
      await db.delete(users).where(eq(users.clerkId, clerkId))
      logger.info('User deleted from database', { clerkId })
    } catch (error) {
      logger.error('Error deleting user from database', { error, clerkId })
    }
  }

  return NextResponse.json({ success: true })
}
