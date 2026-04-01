'use client'

import { ApolloProvider } from '@apollo/client/react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { PostHogProvider } from '@/analytics'
import { ToastContainer } from '@/components/atoms'
import { apolloClient } from '@/libs/ApolloClient'
import { ClerkProvider, QueryProvider } from '@/providers'
import '@/styles/global.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body>
        <ClerkProvider>
          <PostHogProvider>
            <ApolloProvider client={apolloClient}>
              <QueryProvider>
                {children}
                <ToastContainer />
                <Analytics />
                <SpeedInsights />
              </QueryProvider>
            </ApolloProvider>
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
