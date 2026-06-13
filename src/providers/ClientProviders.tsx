'use client'

import { ApolloProvider } from '@apollo/client/react'
import dynamic from 'next/dynamic'

import { ToastContainer } from '@/components/atoms'
import { apolloClient } from '@/libs/ApolloClient'

import { ClerkProvider } from './ClerkProvider'
import { QueryProvider } from './QueryProvider'

const PostHogProvider = dynamic(
  () => import('@/analytics').then((m) => m.PostHogProvider),
  { ssr: false, loading: () => null }
)

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
