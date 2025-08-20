import type { Metadata } from 'next'

import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Sign Up - c0d3ster',
  description: 'Create your c0d3ster account',
}

export default function SignUpPage() {
  return <SignUp path='/sign-up' />
}
