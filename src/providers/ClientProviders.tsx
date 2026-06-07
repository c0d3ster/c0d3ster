'use client'

import { ApolloProvider } from '@apollo/client/react'

import { PostHogProvider } from '@/analytics'
import { ToastContainer } from '@/components/atoms'
import { apolloClient } from '@/libs/ApolloClient'

import { ClerkProvider } from './ClerkProvider'
import { QueryProvider } from './QueryProvider'

export const ClientProviders = ({ children }: { children: React.ReactNode }) => (
  <ClerkProvider>
    <PostHogProvider>
      <ApolloProvider client={apolloClient}>
        <QueryProvider>
          {children}
          <ToastContainer />
        </QueryProvider>
      </ApolloProvider>
    </PostHogProvider>
  </ClerkProvider>
)
