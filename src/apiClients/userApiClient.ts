import { gql } from 'graphql-tag'

import type {
  GetMeQuery,
  GetUserQuery,
  GetUserQueryVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from '@/graphql/generated/graphql'

import {
  GetMeDocument,
  GetUserDocument,
  UpdateUserDocument,
  useGetMeQuery,
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
      avatarUrl
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
      avatarUrl
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

// Hooks for components
export const useGetMe = () => useGetMeQuery()
export const useGetUser = (id: string) => useGetUserQuery({ variables: { id } })

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
