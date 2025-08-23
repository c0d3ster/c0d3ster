import { gql, useMutation } from '@apollo/client'

import type {
  CreateProjectRequestMutation,
  CreateProjectRequestMutationVariables,
  GetMyProjectRequestsQuery,
  GetProjectRequestsQuery,
} from '@/graphql/generated/graphql'

import {
  CreateProjectRequestDocument,
  GetMyProjectRequestsDocument,
  GetProjectRequestsDocument,
  useCreateProjectRequestMutation,
  useGetMyProjectRequestsQuery,
  useGetProjectRequestsQuery,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const GET_PROJECT_REQUESTS = gql`
  query GetProjectRequests {
    projectRequests {
      id
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
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`

export const GET_MY_PROJECT_REQUESTS = gql`
  query GetMyProjectRequests {
    myProjectRequests {
      id
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

export const CREATE_PROJECT_REQUEST = gql`
  mutation CreateProjectRequest($input: CreateProjectRequestInput!) {
    createProjectRequest(input: $input) {
      id
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
    approveProjectRequest(id: $id) {
      id
      title
      description
      projectType
      budget
      requirements
      techStack
      status
      progressPercentage
      startDate
      endDate
      createdAt
      updatedAt
      client {
        id
        firstName
        lastName
        email
      }
      developer {
        id
        firstName
        lastName
        email
      }
    }
  }
`

// Hooks for components
export const useGetProjectRequests = () => useGetProjectRequestsQuery()
export const useGetMyProjectRequests = () => useGetMyProjectRequestsQuery()
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

export const getMyProjectRequests = async () => {
  const result = await apolloClient.query<GetMyProjectRequestsQuery>({
    query: GetMyProjectRequestsDocument,
  })
  if (!result.data)
    throw new Error('No data returned from GetMyProjectRequests query')
  return result.data.myProjectRequests
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
  const result = await apolloClient.mutate({
    mutation: APPROVE_PROJECT_REQUEST,
    variables: { id },
  })
  if (!result.data)
    throw new Error('No data returned from ApproveProjectRequest mutation')
  return result.data.approveProjectRequest
}
