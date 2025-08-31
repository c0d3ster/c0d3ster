import { gql } from '@apollo/client'

import type { GetMyDashboardQuery } from '@/graphql/generated/graphql'

import {
  GetMyDashboardDocument,
  useGetMyDashboardQuery,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

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
        techStack
        repositoryUrl
        startDate
        estimatedCompletionDate
        actualCompletionDate
        createdAt
        updatedAt
        liveUrl
        stagingUrl
        featured
        requestId
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
          email
          firstName
          lastName
        }
      }
      availableProjects {
        id
        title
        projectName
        description
        projectType
        budget
        status
        techStack
        repositoryUrl
        startDate
        estimatedCompletionDate
        createdAt
        updatedAt
        featured
      }
      assignedProjects {
        id
        title
        projectName
        description
        projectType
        budget
        status
        progressPercentage
        techStack
        repositoryUrl
        startDate
        estimatedCompletionDate
        createdAt
        updatedAt
        featured
      }
    }
  }
`

// Hooks for components
export const useGetMyDashboard = () => useGetMyDashboardQuery()

// Async functions for SSR / non-hook usage
export const getMyDashboard = async () => {
  const result = await apolloClient.query<GetMyDashboardQuery>({
    query: GetMyDashboardDocument,
  })
  if (!result.data)
    throw new Error('No data returned from GetMyDashboard query')
  return result.data.myDashboard
}
