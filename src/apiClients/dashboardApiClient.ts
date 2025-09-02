import { gql } from '@apollo/client'

import type { GetMyDashboardQuery } from '@/graphql/generated/graphql'

import {
  GetMyDashboardDocument,
  useGetMyDashboardQuery,
} from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'

import {
  DASHBOARD_PROJECT_FRAGMENT,
  PROJECT_DISPLAY_FRAGMENT,
  PROJECT_REQUEST_DISPLAY_FRAGMENT,
  USER_DISPLAY_FRAGMENT,
} from './fragments'

export const GET_MY_DASHBOARD = gql`
  query GetMyDashboard {
    myDashboard {
      summary {
        totalProjects
        activeProjects
        completedProjects
        totalRequests
        pendingReviewRequests
        inReviewRequests
      }
      projects {
        ...DashboardProject
      }
      projectRequests {
        ...ProjectRequestDisplay
      }
      availableProjects {
        ...ProjectDisplay
        budget
        startDate
        estimatedCompletionDate
        updatedAt
        client {
          ...UserDisplay
        }
      }
      assignedProjects {
        ...DashboardProject
      }
    }
  }
  ${DASHBOARD_PROJECT_FRAGMENT}
  ${PROJECT_REQUEST_DISPLAY_FRAGMENT}
  ${PROJECT_DISPLAY_FRAGMENT}
  ${USER_DISPLAY_FRAGMENT}
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
