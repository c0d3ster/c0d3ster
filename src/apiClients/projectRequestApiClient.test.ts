import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectType } from '@/graphql/generated/graphql'
import { apolloClient } from '@/libs/ApolloClient'
import {
  createMockProjectRequest,
  createMockProjectRequests,
} from '@/tests/mocks'

import {
  APPROVE_PROJECT_REQUEST,
  approveProjectRequest,
  CREATE_PROJECT_REQUEST,
  createProjectRequest,
  GET_PROJECT_REQUESTS,
  getProjectRequests,
  UPDATE_PROJECT_REQUEST_STATUS,
  useApproveProjectRequest,
  useCreateProjectRequest,
  useGetProjectRequests,
  useUpdateProjectRequestStatus,
} from './projectRequestApiClient'

// Mock Apollo Client
vi.mock('@/libs/ApolloClient', () => ({
  apolloClient: {
    query: vi.fn(),
    mutate: vi.fn(),
  },
}))

// Mock the generated GraphQL hooks
vi.mock('@/graphql/generated/graphql', async () => {
  const actual = await vi.importActual('@/graphql/generated/graphql')
  return {
    ...actual,
    useGetProjectRequestsQuery: vi.fn(),
    useCreateProjectRequestMutation: vi.fn(),
    useMutation: vi.fn(),
    GetProjectRequestsDocument: 'GET_PROJECT_REQUESTS_DOCUMENT',
    CreateProjectRequestDocument: 'CREATE_PROJECT_REQUEST_DOCUMENT',
  }
})

describe('Project Request API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GraphQL Operations', () => {
    it('should define all GraphQL operations', () => {
      expect(GET_PROJECT_REQUESTS).toBeDefined()
      expect(CREATE_PROJECT_REQUEST).toBeDefined()
      expect(APPROVE_PROJECT_REQUEST).toBeDefined()
      expect(UPDATE_PROJECT_REQUEST_STATUS).toBeDefined()

      expect(GET_PROJECT_REQUESTS.definitions.length).toBeGreaterThan(0)
      expect(CREATE_PROJECT_REQUEST.definitions.length).toBeGreaterThan(0)
      expect(APPROVE_PROJECT_REQUEST.definitions.length).toBeGreaterThan(0)
      expect(UPDATE_PROJECT_REQUEST_STATUS.definitions.length).toBeGreaterThan(
        0
      )
    })
  })

  describe('Hooks', () => {
    it('should export all required hooks', () => {
      expect(useGetProjectRequests).toBeDefined()
      expect(useCreateProjectRequest).toBeDefined()
      expect(useApproveProjectRequest).toBeDefined()
      expect(useUpdateProjectRequestStatus).toBeDefined()

      expect(typeof useGetProjectRequests).toBe('function')
      expect(typeof useCreateProjectRequest).toBe('function')
      expect(typeof useApproveProjectRequest).toBe('function')
      expect(typeof useUpdateProjectRequestStatus).toBe('function')
    })
  })

  describe('Async Functions', () => {
    describe('getProjectRequests', () => {
      it('should successfully get project requests', async () => {
        const mockProjectRequests = createMockProjectRequests(1)
        const mockResponse = {
          data: {
            projectRequests: mockProjectRequests,
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        const result = await getProjectRequests()

        expect(apolloClient.query).toHaveBeenCalledWith({
          query: 'GET_PROJECT_REQUESTS_DOCUMENT',
        })
        expect(result).toEqual(mockResponse.data.projectRequests)
      })

      it('should throw error when no data is returned', async () => {
        vi.mocked(apolloClient.query).mockResolvedValue({ data: null })

        await expect(getProjectRequests()).rejects.toThrow(
          'No data returned from GetProjectRequests query'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const error = new Error('Network error')
        vi.mocked(apolloClient.query).mockRejectedValue(error)

        await expect(getProjectRequests()).rejects.toThrow('Network error')
      })
    })

    describe('createProjectRequest', () => {
      it('should successfully create project request', async () => {
        const mockInput = createMockProjectRequest({
          projectName: 'Test Project',
          title: 'Test Request',
          description: 'Test description',
          budget: 10000,
          timeline: '3 months',
          requirements: 'Requirement 1, Requirement 2',
          additionalInfo: 'Additional info',
        })

        const mockResponse = {
          data: {
            createProjectRequest: {
              id: '1',
              projectName: 'Test Project',
              title: 'Test Request',
              description: 'Test description',
              projectType: ProjectType.WebApp,
              budget: 10000,
              timeline: '3 months',
              requirements: 'Requirement 1, Requirement 2',
              contactPreference: 'EMAIL',
              additionalInfo: 'Additional info',
              status: 'PENDING',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          },
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        const result = await createProjectRequest(mockInput)

        expect(apolloClient.mutate).toHaveBeenCalledWith({
          mutation: 'CREATE_PROJECT_REQUEST_DOCUMENT',
          variables: { input: mockInput },
        })
        expect(result).toEqual(mockResponse.data.createProjectRequest)
      })

      it('should throw error when no data is returned', async () => {
        const mockInput = createMockProjectRequest({
          projectName: 'Test Project',
          title: 'Test Request',
          description: 'Test description',
          budget: 10000,
          timeline: '3 months',
          requirements: 'Requirement 1',
        })

        vi.mocked(apolloClient.mutate).mockResolvedValue({ data: null })

        await expect(createProjectRequest(mockInput)).rejects.toThrow(
          'No data returned from CreateProjectRequest mutation'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const mockInput = createMockProjectRequest({
          projectName: 'Test Project',
          title: 'Test Request',
          description: 'Test description',
          budget: 10000,
          timeline: '3 months',
          requirements: 'Requirement 1',
        })

        const error = new Error('Network error')
        vi.mocked(apolloClient.mutate).mockRejectedValue(error)

        await expect(createProjectRequest(mockInput)).rejects.toThrow(
          'Network error'
        )
      })
    })

    describe('approveProjectRequest', () => {
      it('should successfully approve project request', async () => {
        const mockId = 'request-1'
        const mockResponse = {
          data: {
            approveProjectRequest: true,
          },
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        const result = await approveProjectRequest(mockId)

        expect(apolloClient.mutate).toHaveBeenCalledWith({
          mutation: APPROVE_PROJECT_REQUEST,
          variables: { id: mockId },
        })
        expect(result).toBe(true)
      })

      it('should throw error when no data is returned', async () => {
        const mockId = 'request-1'

        vi.mocked(apolloClient.mutate).mockResolvedValue({ data: null })

        await expect(approveProjectRequest(mockId)).rejects.toThrow(
          'No data returned from ApproveProjectRequest mutation'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const mockId = 'request-1'
        const error = new Error('Network error')

        vi.mocked(apolloClient.mutate).mockRejectedValue(error)

        await expect(approveProjectRequest(mockId)).rejects.toThrow(
          'Network error'
        )
      })
    })
  })
})
