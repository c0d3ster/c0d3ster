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

// Attach cookies for SSR requests. The request goes to the host the user came in
// on, because fetch drops the cookie header when a redirect crosses hosts (e.g.
// apex -> www), which turns an authenticated page load into an anonymous query.
const authLink = setContext(async (_, { headers }) => {
  if (typeof window === 'undefined') {
    const { headers: nextHeaders } = await import('next/headers')
    const requestHeaders = await nextHeaders()
    const cookie = requestHeaders.get('cookie') ?? ''
    const host =
      requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
    if (!host) return { headers: { ...headers, cookie } }

    const proto =
      requestHeaders.get('x-forwarded-proto') ??
      (host.startsWith('localhost') ? 'http' : 'https')
    return {
      uri: `${proto}://${host}/api/graphql`,
      headers: { ...headers, cookie },
    }
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
      fetchPolicy: 'cache-first',
    },
  },
})
