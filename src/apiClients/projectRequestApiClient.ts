import { useMutation } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  ApproveProjectRequestMutation,
  ApproveProjectRequestMutationVariables,
  CreateProjectRequestMutation,
  CreateProjectRequestMutationVariables,
  GetProjectRequestsQuery,
} from '@/graphql/generated/graphql'

import {
  CreateProjectRequestDocument,
  GetProjectRequestsDocument,
  useCreateProjectRequestMutation,
  useGetProjectRequestsQuery,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const GET_PROJECT_REQUESTS = gql`
  query GetProjectRequests {
    projectRequests {
      id
      projectName
      title
      description
      projectType
      budget
      timeline
      requirements
      additionalInfo
      status
      createdAt
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`

export const CREATE_PROJECT_REQUEST = gql`
  mutation CreateProjectRequest($input: CreateProjectRequestInput!) {
    createProjectRequest(input: $input) {
      id
      projectName
      title
      description
      projectType
      budget
      timeline
      requirements
      contactPreference
      additionalInfo
      status
      createdAt
      updatedAt
    }
  }
`

export const APPROVE_PROJECT_REQUEST = gql`
  mutation ApproveProjectRequest($id: ID!) {
    approveProjectRequest(id: $id)
  }
`

// Hooks for components
export const useGetProjectRequests = () => useGetProjectRequestsQuery()
export const useCreateProjectRequest = () => useCreateProjectRequestMutation()
export const useApproveProjectRequest = () =>
  useMutation(APPROVE_PROJECT_REQUEST)

// Async functions for SSR / non-hook usage
export const getProjectRequests = async () => {
  const result = await apolloClient.query<GetProjectRequestsQuery>({
    query: GetProjectRequestsDocument,
  })
  if (!result.data)
    throw new Error('No data returned from GetProjectRequests query')
  return result.data.projectRequests
}

export const createProjectRequest = async (
  input: CreateProjectRequestMutationVariables['input']
) => {
  const result = await apolloClient.mutate<
    CreateProjectRequestMutation,
    CreateProjectRequestMutationVariables
  >({
    mutation: CreateProjectRequestDocument,
    variables: { input },
  })
  if (!result.data)
    throw new Error('No data returned from CreateProjectRequest mutation')
  return result.data.createProjectRequest
}

export const approveProjectRequest = async (id: string) => {
  const result = await apolloClient.mutate<
    ApproveProjectRequestMutation,
    ApproveProjectRequestMutationVariables
  >({
    mutation: APPROVE_PROJECT_REQUEST,
    variables: { id },
  })
  if (!result.data?.approveProjectRequest)
    throw new Error('No data returned from ApproveProjectRequest mutation')
  return result.data.approveProjectRequest
}
