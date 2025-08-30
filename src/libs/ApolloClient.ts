import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

import { getBaseUrl } from '@/utils/Env'

// Determine the GraphQL endpoint URL
const getGraphQLEndpoint = () => {
  if (typeof window === 'undefined') {
    return `${getBaseUrl()}/api/graphql`
  }
  return '/api/graphql'
}

const httpLink = new HttpLink({
  uri: getGraphQLEndpoint(),
  credentials: 'include', // send cookies if you need auth
})

// Attach cookies for SSR requests
const authLink = setContext(async (_, { headers }) => {
  if (typeof window === 'undefined') {
    const { headers: nextHeaders } = await import('next/headers')
    const cookie = (await nextHeaders()).get('cookie') ?? ''
    return { headers: { ...headers, cookie } }
  }
  return { headers }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
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
