import { gql } from 'graphql-tag'

import type {
  GetMeQuery,
  GetMyDashboardQuery,
  GetUserQuery,
  GetUserQueryVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from '@/graphql/generated/graphql'

import {
  GetMeDocument,
  GetMyDashboardDocument,
  GetUserDocument,
  UpdateUserDocument,
  useGetMeQuery,
  useGetMyDashboardQuery,
  useGetUserQuery,
  useUpdateUserMutation,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const GET_ME = gql`
  query GetMe {
    me {
      id
      clerkId
      email
      firstName
      lastName
      role
      bio
      skills
      portfolio
      hourlyRate
      availability
      createdAt
      updatedAt
    }
  }
`

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      clerkId
      email
      firstName
      lastName
      role
      bio
      skills
      portfolio
      hourlyRate
      availability
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      firstName
      lastName
      bio
      skills
      portfolio
      hourlyRate
      availability
      updatedAt
    }
  }
`

export const GET_MY_DASHBOARD = gql`
  query GetMyDashboard {
    myDashboard {
      projects {
        id
        title
        status
      }
      projectRequests {
        id
        title
        status
      }
      summary {
        totalProjects
        activeProjects
        completedProjects
        pendingRequests
      }
    }
  }
`

export const TEST_USER_QUERY = gql`
  query TestUserQuery {
    me {
      id
      email
      firstName
    }
  }
`

// Hooks for components
export const useGetMe = () => useGetMeQuery()
export const useGetUser = (id: string) => useGetUserQuery({ variables: { id } })
export const useGetMyDashboard = () => useGetMyDashboardQuery()
export const useUpdateUser = () => useUpdateUserMutation()

// Async functions for SSR / non-hook usage
export const getMe = async () => {
  const result = await apolloClient.query<GetMeQuery>({
    query: GetMeDocument,
  })
  if (!result.data) throw new Error('No data returned from GetMe query')
  return result.data.me
}

export const getUser = async (id: string) => {
  const result = await apolloClient.query<GetUserQuery, GetUserQueryVariables>({
    query: GetUserDocument,
    variables: { id },
  })
  if (!result.data) throw new Error('No data returned from GetUser query')
  return result.data.user
}

export const updateUser = async (
  id: string,
  input: UpdateUserMutationVariables['input']
) => {
  const result = await apolloClient.mutate<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >({
    mutation: UpdateUserDocument,
    variables: { id, input },
  })
  if (!result.data) throw new Error('No data returned from UpdateUser mutation')
  return result.data.updateUser
}

export const getMyDashboard = async () => {
  const result = await apolloClient.query<GetMyDashboardQuery>({
    query: GetMyDashboardDocument,
  })
  if (!result.data)
    throw new Error('No data returned from GetMyDashboard query')
  return result.data.myDashboard
}
