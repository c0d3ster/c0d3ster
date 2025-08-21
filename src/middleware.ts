import type { NextFetchEvent, NextRequest } from 'next/server'

import { detectBot } from '@arcjet/next'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import arcjet from '@/libs/Arcjet'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    // Block all bots except the following
    allow: [
      // See https://docs.arcjet.com/bot-protection/identifying-bots
      'CATEGORY:SEARCH_ENGINE', // Allow search engines
      'CATEGORY:PREVIEW', // Allow preview links to show OG images
      'CATEGORY:MONITOR', // Allow uptime monitoring services
    ],
  })
)

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  // Note: API routes need Clerk middleware for auth() to work

  // Verify the request with Arcjet
  // Use `process.env` instead of Env to reduce bundle size in middleware
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request)

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Run Clerk middleware for ALL routes to enable auth() in API routes
  return clerkMiddleware(async (auth, req) => {
    // Only protect dashboard routes
    if (isProtectedRoute(req)) {
      const signInUrl = new URL('/sign-in', req.url)

      await auth.protect({
        unauthenticatedUrl: signInUrl.toString(),
      })
    }

    return NextResponse.next()
  })(request, event)
}

export const config = {
  // Match all pathnames except for
  // - webhook endpoints (they handle their own auth)
  // - … if they start with `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api/webhook|_next|_vercel|monitoring|.*\\..*).*)',
}
