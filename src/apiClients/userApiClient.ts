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
      summary {
        totalProjects
        activeProjects
        completedProjects
        pendingRequests
      }
      projects {
        id
        title
        projectName
        description
        projectType
        budget
        status
        progressPercentage
        startDate
        estimatedCompletionDate
        actualCompletionDate
        createdAt
        updatedAt
        techStack
        requestId
        clientId
        developerId
        requirements
        repositoryUrl
        liveUrl
        stagingUrl
        featured
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
        collaborators {
          id
          role
          joinedAt
          user {
            id
            firstName
            lastName
            email
          }
        }
        statusUpdates {
          id
          oldStatus
          newStatus
          progressPercentage
          updateMessage
          isClientVisible
          createdAt
          updatedBy {
            id
            firstName
            lastName
            email
          }
        }
      }
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
          firstName
          lastName
          email
        }
      }
      availableProjects {
        id
        title
        projectName
        description
        projectType
        budget
        priority
        techStack
        repositoryUrl
        startDate
        estimatedCompletionDate
        createdAt
        updatedAt
        featured
        client {
          id
          firstName
          lastName
          email
        }
      }
      assignedProjects {
        id
        title
        projectName
        description
        projectType
        budget
        status
        priority
        progressPercentage
        startDate
        estimatedCompletionDate
        actualCompletionDate
        liveUrl
        stagingUrl
        repositoryUrl
        techStack
        createdAt
        updatedAt
        featured
        client {
          id
          firstName
          lastName
          email
        }
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
