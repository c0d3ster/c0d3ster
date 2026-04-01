import type { NextFetchEvent, NextRequest } from 'next/server'

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  // Note: API routes need Clerk middleware for auth() to work
  return clerkMiddleware(async (auth, req) => {
    // Only protect dashboard routes
    if (isProtectedRoute(req)) {
      await auth.protect()
    }
  })(request, event)
}

export const config = {
  // Match all pathnames except for
  // - webhook endpoints (they handle their own auth)
  // - … if they start with `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api/webhook|_next|_vercel|monitoring|.*\\..*).*)',
}
