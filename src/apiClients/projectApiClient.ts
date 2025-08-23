import { useMutation } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  AssignProjectMutation,
  AssignProjectMutationVariables,
  GetAssignedProjectsQuery,
  GetAvailableProjectsDetailedQuery,
  GetMyProjectsQuery,
  GetProjectsQuery,
} from '@/graphql/generated/graphql'

import {
  GetAssignedProjectsDocument,
  GetAvailableProjectsDetailedDocument,
  GetMyProjectsDocument,
  GetProjectsDocument,
  useGetAssignedProjectsQuery,
  useGetAvailableProjectsDetailedQuery,
  useGetMyProjectsQuery,
  useGetProjectsQuery,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      title
      status
      developer {
        id
        firstName
        lastName
        email
      }
    }
  }
`

export const GET_MY_PROJECTS = gql`
  query GetMyProjects {
    myProjects {
      id
      title
      status
      developer {
        id
        firstName
        lastName
        email
      }
    }
  }
`

export const GET_AVAILABLE_PROJECTS_DETAILED = gql`
  query GetAvailableProjectsDetailed {
    availableProjects {
      id
      title
      description
      projectType
      budget
      techStack
      status
      client {
        id
        firstName
        lastName
        email
      }
    }
  }
`

export const GET_ASSIGNED_PROJECTS = gql`
  query GetAssignedProjects {
    assignedProjects {
      id
      title
      status
      developer {
        id
        firstName
        lastName
        email
      }
    }
  }
`

export const ASSIGN_PROJECT = gql`
  mutation AssignProject($projectId: ID!, $developerId: ID!) {
    assignProject(projectId: $projectId, developerId: $developerId) {
      id
      title
      status
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
export const useGetProjects = () => useGetProjectsQuery()
export const useGetMyProjects = () => useGetMyProjectsQuery()
export const useGetAvailableProjects = () =>
  useGetAvailableProjectsDetailedQuery()
export const useGetAssignedProjects = () => useGetAssignedProjectsQuery()
export const useAssignProject = () => useMutation(ASSIGN_PROJECT)

// Async functions for SSR / non-hook usage
export const getProjects = async () => {
  const result = await apolloClient.query<GetProjectsQuery>({
    query: GetProjectsDocument,
  })
  if (!result.data) throw new Error('No data returned from GetProjects query')
  return result.data.projects
}

export const getMyProjects = async () => {
  const result = await apolloClient.query<GetMyProjectsQuery>({
    query: GetMyProjectsDocument,
  })
  if (!result.data) throw new Error('No data returned from GetMyProjects query')
  return result.data.myProjects
}

export const getAvailableProjects = async () => {
  const result = await apolloClient.query<GetAvailableProjectsDetailedQuery>({
    query: GetAvailableProjectsDetailedDocument,
  })
  if (!result.data)
    throw new Error('No data returned from GetAvailableProjectsDetailed query')
  return result.data.availableProjects
}

export const getAssignedProjects = async () => {
  const result = await apolloClient.query<GetAssignedProjectsQuery>({
    query: GetAssignedProjectsDocument,
  })
  if (!result.data)
    throw new Error('No data returned from GetAssignedProjects query')
  return result.data.assignedProjects
}

export const assignProject = async (projectId: string, developerId: string) => {
  const result = await apolloClient.mutate<
    AssignProjectMutation,
    AssignProjectMutationVariables
  >({
    mutation: ASSIGN_PROJECT,
    variables: { projectId, developerId },
  })
  if (!result.data?.assignProject)
    throw new Error('No data returned from AssignProject mutation')
  return result.data.assignProject
}
