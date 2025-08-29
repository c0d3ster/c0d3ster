import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

import { Env } from './Env'

// Determine the GraphQL endpoint URL
const getGraphQLEndpoint = () => {
  // If we're on the server side (SSR), we need an absolute URL
  if (typeof window === 'undefined') {
    // Use environment variable if available, otherwise use localhost for development
    const baseUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/api/graphql`
  }
  // Client-side can use relative URL
  return '/api/graphql'
}

const httpLink = new HttpLink({
  uri: getGraphQLEndpoint(),
  credentials: 'include', // send cookies if you need auth
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
})
