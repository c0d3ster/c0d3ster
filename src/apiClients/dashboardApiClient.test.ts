import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apolloClient } from '@/libs/ApolloClient'

import {
  GET_MY_DASHBOARD,
  getMyDashboard,
  useGetMyDashboard,
} from './dashboardApiClient'

// Mock Apollo Client
vi.mock('@/libs/ApolloClient', () => ({
  apolloClient: {
    query: vi.fn(),
  },
}))

// Mock the generated GraphQL hooks
vi.mock('@/graphql/generated/graphql', () => ({
  useGetMyDashboardQuery: vi.fn(),
  GetMyDashboardDocument: 'GET_MY_DASHBOARD_DOCUMENT',
}))

describe('Dashboard API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GraphQL Operations', () => {
    it('should define GET_MY_DASHBOARD operation', () => {
      expect(GET_MY_DASHBOARD).toBeDefined()
      expect(GET_MY_DASHBOARD.definitions.length).toBeGreaterThan(0)
      expect(GET_MY_DASHBOARD.definitions[0]?.kind).toBe('OperationDefinition')
    })
  })

  describe('Hooks', () => {
    it('should export useGetMyDashboard hook', () => {
      expect(useGetMyDashboard).toBeDefined()
      expect(typeof useGetMyDashboard).toBe('function')
    })
  })

  describe('Async Functions', () => {
    describe('getMyDashboard', () => {
      it('should successfully get dashboard data', async () => {
        const mockResponse = {
          data: {
            myDashboard: {
              summary: {
                totalProjects: 5,
                activeProjects: 3,
                completedProjects: 2,
                totalRequests: 10,
                pendingReviewRequests: 4,
                inReviewRequests: 2,
              },
              projects: [],
              projectRequests: [],
              availableProjects: [],
              assignedProjects: [],
            },
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        const result = await getMyDashboard()

        expect(apolloClient.query).toHaveBeenCalledWith({
          query: 'GET_MY_DASHBOARD_DOCUMENT',
        })
        expect(result).toEqual(mockResponse.data.myDashboard)
      })

      it('should throw error when no data is returned', async () => {
        vi.mocked(apolloClient.query).mockResolvedValue({ data: null })

        await expect(getMyDashboard()).rejects.toThrow(
          'No data returned from GetMyDashboard query'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const error = new Error('Network error')
        vi.mocked(apolloClient.query).mockRejectedValue(error)

        await expect(getMyDashboard()).rejects.toThrow('Network error')
      })
    })
  })
})
