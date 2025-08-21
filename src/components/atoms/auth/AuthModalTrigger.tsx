'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export const AuthModalTrigger = (): null => {
  const { isSignedIn } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const authRequired = searchParams.get('auth')

  useEffect(() => {
    if (authRequired === 'required') {
      if (isSignedIn) {
        // If already signed in, redirect to dashboard
        router.push('/dashboard')
      } else {
        // Redirect to sign-in page - Clerk will handle this smoothly
        router.push('/sign-in?redirect_url=/dashboard')
      }
    }
  }, [authRequired, isSignedIn, router])

  // This component renders nothing - it's just for the side effect
  return null
}
