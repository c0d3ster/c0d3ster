import { useMutation } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  AssignProjectMutation,
  AssignProjectMutationVariables,
  GetAssignedProjectsQuery,
  GetAvailableProjectsDetailedQuery,
  GetFeaturedProjectsQuery,
  GetMyProjectsQuery,
  GetProjectBySlugQuery,
  GetProjectsQuery,
} from '@/graphql/generated/graphql'

import {
  GetAssignedProjectsDocument,
  GetAvailableProjectsDetailedDocument,
  GetFeaturedProjectsDocument,
  GetMyProjectsDocument,
  GetProjectBySlugDocument,
  GetProjectsDocument,
  useGetAssignedProjectsQuery,
  useGetAvailableProjectsDetailedQuery,
  useGetFeaturedProjectsQuery,
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
      featured
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
  }
`

export const GET_PROJECT_BY_SLUG = gql`
  query GetProjectBySlug($slug: String!) {
    projectBySlug(slug: $slug) {
      id
      title
      projectName
      description
      overview
      techStack
      status
      logo
      liveUrl
      repositoryUrl
      featured
      projectType
      budget
      requirements
      progressPercentage
      startDate
      estimatedCompletionDate
      actualCompletionDate
      createdAt
      updatedAt
      clientId
      developerId
      requestId
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
  }
`

export const GET_FEATURED_PROJECTS = gql`
  query GetFeaturedProjects($userEmail: String) {
    featuredProjects(userEmail: $userEmail) {
      id
      title
      projectName
      description
      overview
      techStack
      status
      logo
      liveUrl
      repositoryUrl
      featured
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
export const useGetFeaturedProjects = (userEmail?: string) =>
  useGetFeaturedProjectsQuery({
    variables: userEmail ? { userEmail } : undefined,
  })
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

export const getProjectBySlug = async (slug: string) => {
  const result = await apolloClient.query<GetProjectBySlugQuery>({
    query: GetProjectBySlugDocument,
    variables: { slug },
  })
  if (!result.data)
    throw new Error('No data returned from GetProjectBySlug query')
  return result.data.projectBySlug
}

export const getFeaturedProjects = async (userEmail?: string) => {
  const result = await apolloClient.query<GetFeaturedProjectsQuery>({
    query: GetFeaturedProjectsDocument,
    variables: userEmail ? { userEmail } : undefined,
  })
  if (!result.data)
    throw new Error('No data returned from GetFeaturedProjects query')
  return result.data.featuredProjects
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
