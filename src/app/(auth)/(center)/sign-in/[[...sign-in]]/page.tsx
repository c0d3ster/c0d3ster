import type { Metadata } from 'next'

import { SignIn } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Sign In - c0d3ster',
  description: 'Sign in to your c0d3ster account',
}

export default function SignInPage() {
  return <SignIn path='/sign-in' />
}
