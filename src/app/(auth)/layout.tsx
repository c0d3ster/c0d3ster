import { ClerkProvider } from '@clerk/nextjs'

import { ClerkLocalizations } from '@/utils/AppConfig'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clerkLocale = ClerkLocalizations.defaultLocale

  return (
    <ClerkProvider
      localization={clerkLocale}
      signInUrl='/sign-in'
      signUpUrl='/sign-up'
      signInFallbackRedirectUrl='/dashboard'
      signUpFallbackRedirectUrl='/dashboard'
      afterSignOutUrl='/'
      appearance={{
        cssLayerName: 'clerk', // Ensure Clerk is compatible with Tailwind CSS v4
      }}
    >
      {children}
    </ClerkProvider>
  )
}
