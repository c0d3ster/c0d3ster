import { useMutation } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  AssignProjectMutation,
  AssignProjectMutationVariables,
  GetFeaturedProjectsQuery,
  GetProjectBySlugQuery,
  GetProjectsQuery,
  ProjectFilter,
} from '@/graphql/generated/graphql'

import {
  GetFeaturedProjectsDocument,
  GetProjectBySlugDocument,
  GetProjectsDocument,
  useGetFeaturedProjectsQuery,
  useGetProjectBySlugQuery,
  useGetProjectsQuery,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

import {
  DASHBOARD_PROJECT_FRAGMENT,
  PROJECT_DISPLAY_FRAGMENT,
  PROJECT_REQUEST_DISPLAY_FRAGMENT,
  USER_DISPLAY_FRAGMENT,
} from './fragments'

// GraphQL Operations
export const GET_PROJECTS = gql`
  query GetProjects($filter: ProjectFilter, $userEmail: String) {
    projects(filter: $filter, userEmail: $userEmail) {
      ...ProjectDisplay
    }
  }
  ${PROJECT_DISPLAY_FRAGMENT}
`

export const GET_FEATURED_PROJECTS = gql`
  query GetFeaturedProjects($userEmail: String) {
    featuredProjects(userEmail: $userEmail) {
      ...ProjectDisplay
    }
  }
  ${PROJECT_DISPLAY_FRAGMENT}
`

export const GET_PROJECT_BY_SLUG = gql`
  query GetProjectBySlug($slug: String!) {
    projectBySlug(slug: $slug) {
      id
      title
      projectName
      description
      overview
      projectType
      budget
      requirements
      techStack
      status
      progressPercentage
      priority
      startDate
      estimatedCompletionDate
      actualCompletionDate
      repositoryUrl
      liveUrl
      stagingUrl
      featured
      logo
      createdAt
      updatedAt
      clientId
      developerId
      requestId
      client {
        ...UserDisplay
      }
      developer {
        ...UserDisplay
      }
      collaborators {
        id
        role
        joinedAt
        user {
          ...UserDisplay
        }
      }

      statusUpdates {
        id
        entityType
        entityId
        oldStatus
        newStatus
        progressPercentage
        updateMessage
        isClientVisible
        updatedBy
        createdAt
        updatedByUser {
          ...UserDisplay
        }
      }
    }
  }
  ${PROJECT_REQUEST_DISPLAY_FRAGMENT}
  ${USER_DISPLAY_FRAGMENT}
`

export const ASSIGN_PROJECT = gql`
  mutation AssignProject($projectId: ID!, $developerId: ID!) {
    assignProject(projectId: $projectId, developerId: $developerId) {
      ...DashboardProject
    }
  }
  ${DASHBOARD_PROJECT_FRAGMENT}
`

// Hooks for components
export const useGetProjects = (filter?: ProjectFilter, userEmail?: string) =>
  useGetProjectsQuery({
    variables: {
      filter: filter || undefined,
      userEmail: userEmail || undefined,
    },
  })
export const useGetFeaturedProjects = (userEmail?: string) =>
  useGetFeaturedProjectsQuery({
    variables: userEmail ? { userEmail } : undefined,
  })

export const useGetProjectBySlug = (slug: string) =>
  useGetProjectBySlugQuery({
    variables: { slug },
  })

export const useAssignProject = () => useMutation(ASSIGN_PROJECT)

// Async functions for SSR / non-hook usage
export const getProjects = async (
  filter?: ProjectFilter,
  userEmail?: string
) => {
  const result = await apolloClient.query<GetProjectsQuery>({
    query: GetProjectsDocument,
    variables: {
      filter: filter || undefined,
      userEmail: userEmail || undefined,
    },
  })
  if (!result.data) throw new Error('No data returned from GetProjects query')
  return result.data.projects
}

export const getProjectBySlug = async (slug: string) => {
  const result = await apolloClient.query<GetProjectBySlugQuery>({
    query: GetProjectBySlugDocument,
    variables: { slug },
  })
  if (result.error) {
    throw new Error(result.error.message)
  }
  const project = result.data?.projectBySlug
  if (!project) throw new Error('Project not found')
  return project
}

export const getFeaturedProjects = async (userEmail?: string) => {
  const result = await apolloClient.query<GetFeaturedProjectsQuery>({
    query: GetFeaturedProjectsDocument,
    variables: userEmail ? { userEmail } : undefined,
  })
  if (result.error) {
    throw new Error(result.error.message)
  }
  const projects = result.data?.featuredProjects
  if (!projects) throw new Error('No featured projects returned')
  return projects
}

export const assignProject = async (projectId: string, developerId: string) => {
  const result = await apolloClient.mutate<
    AssignProjectMutation,
    AssignProjectMutationVariables
  >({
    mutation: ASSIGN_PROJECT,
    variables: { projectId, developerId },
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  if (!result.data) {
    throw new Error('No data returned from AssignProject mutation')
  }

  return result.data.assignProject
}
