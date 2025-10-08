import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apolloClient } from '@/libs/ApolloClient'
import { createMockProject, createMockProjects } from '@/tests/mocks'

import {
  ASSIGN_PROJECT,
  assignProject,
  GET_FEATURED_PROJECTS,
  GET_PROJECT_BY_SLUG,
  GET_PROJECTS,
  getFeaturedProjects,
  getProjectBySlug,
  getProjects,
  useAssignProject,
  useGetFeaturedProjects,
  useGetProjectBySlug,
  useGetProjects,
} from './projectApiClient'

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
    useGetProjectsQuery: vi.fn(),
    useGetFeaturedProjectsQuery: vi.fn(),
    useGetProjectBySlugQuery: vi.fn(),
    useMutation: vi.fn(),
    GetProjectsDocument: 'GET_PROJECTS_DOCUMENT',
    GetFeaturedProjectsDocument: 'GET_FEATURED_PROJECTS_DOCUMENT',
    GetProjectBySlugDocument: 'GET_PROJECT_BY_SLUG_DOCUMENT',
  }
})

describe('Project API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GraphQL Operations', () => {
    it('should define all GraphQL operations', () => {
      expect(GET_PROJECTS).toBeDefined()
      expect(GET_FEATURED_PROJECTS).toBeDefined()
      expect(GET_PROJECT_BY_SLUG).toBeDefined()
      expect(ASSIGN_PROJECT).toBeDefined()

      expect(GET_PROJECTS.definitions.length).toBeGreaterThan(0)
      expect(GET_FEATURED_PROJECTS.definitions.length).toBeGreaterThan(0)
      expect(GET_PROJECT_BY_SLUG.definitions.length).toBeGreaterThan(0)
      expect(ASSIGN_PROJECT.definitions.length).toBeGreaterThan(0)
    })
  })

  describe('Hooks', () => {
    it('should export all required hooks', () => {
      expect(useGetProjects).toBeDefined()
      expect(useGetFeaturedProjects).toBeDefined()
      expect(useGetProjectBySlug).toBeDefined()
      expect(useAssignProject).toBeDefined()

      expect(typeof useGetProjects).toBe('function')
      expect(typeof useGetFeaturedProjects).toBe('function')
      expect(typeof useGetProjectBySlug).toBe('function')
      expect(typeof useAssignProject).toBe('function')
    })
  })

  describe('Async Functions', () => {
    describe('getProjects', () => {
      it('should successfully get projects with filter and userEmail', async () => {
        const mockFilter = { status: 'ACTIVE' as any }
        const mockUserEmail = 'user@example.com'
        const mockProjects = createMockProjects(1)
        const mockResponse = {
          data: {
            projects: mockProjects,
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        const result = await getProjects(mockFilter, mockUserEmail)

        expect(apolloClient.query).toHaveBeenCalledWith({
          query: 'GET_PROJECTS_DOCUMENT',
          variables: {
            filter: mockFilter,
            userEmail: mockUserEmail,
          },
        })
        expect(result).toEqual(mockResponse.data.projects)
      })

      it('should successfully get projects without filter and userEmail', async () => {
        const mockResponse = {
          data: {
            projects: [],
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        const result = await getProjects()

        expect(apolloClient.query).toHaveBeenCalledWith({
          query: 'GET_PROJECTS_DOCUMENT',
          variables: {
            filter: undefined,
            userEmail: undefined,
          },
        })
        expect(result).toEqual(mockResponse.data.projects)
      })

      it('should throw error when no data is returned', async () => {
        vi.mocked(apolloClient.query).mockResolvedValue({ data: null })

        await expect(getProjects()).rejects.toThrow(
          'No data returned from GetProjects query'
        )
      })
    })

    describe('getProjectBySlug', () => {
      it('should successfully get project by slug', async () => {
        const mockSlug = 'test-project'
        const mockProject = createMockProject({
          projectName: 'test-project',
        })

        const mockResponse = {
          data: {
            projectBySlug: mockProject,
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        const result = await getProjectBySlug(mockSlug)

        expect(apolloClient.query).toHaveBeenCalledWith({
          query: 'GET_PROJECT_BY_SLUG_DOCUMENT',
          variables: { slug: mockSlug },
        })
        expect(result).toEqual(mockProject)
      })

      it('should throw error when project is not found', async () => {
        const mockSlug = 'non-existent-project'
        const mockResponse = {
          data: {
            projectBySlug: null,
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        await expect(getProjectBySlug(mockSlug)).rejects.toThrow(
          'Project not found'
        )
      })

      it('should throw error when apollo client returns error', async () => {
        const mockSlug = 'test-project'
        const error = new Error('GraphQL error')

        vi.mocked(apolloClient.query).mockResolvedValue({ error } as any)

        await expect(getProjectBySlug(mockSlug)).rejects.toThrow(
          'GraphQL error'
        )
      })
    })

    describe('getFeaturedProjects', () => {
      it('should successfully get featured projects with userEmail', async () => {
        const mockUserEmail = 'user@example.com'
        const mockProjects = createMockProjects(1).map((project) => ({
          ...project,
          featured: true,
        }))

        const mockResponse = {
          data: {
            featuredProjects: mockProjects,
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        const result = await getFeaturedProjects(mockUserEmail)

        expect(apolloClient.query).toHaveBeenCalledWith({
          query: 'GET_FEATURED_PROJECTS_DOCUMENT',
          variables: { userEmail: mockUserEmail },
        })
        expect(result).toEqual(mockProjects)
      })

      it('should successfully get featured projects without userEmail', async () => {
        const mockProjects: any[] = []

        const mockResponse = {
          data: {
            featuredProjects: mockProjects,
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        const result = await getFeaturedProjects()

        expect(apolloClient.query).toHaveBeenCalledWith({
          query: 'GET_FEATURED_PROJECTS_DOCUMENT',
          variables: undefined,
        })
        expect(result).toEqual(mockProjects)
      })

      it('should throw error when no featured projects returned', async () => {
        const mockResponse = {
          data: {
            featuredProjects: null,
          },
        }

        vi.mocked(apolloClient.query).mockResolvedValue(mockResponse)

        await expect(getFeaturedProjects()).rejects.toThrow(
          'No featured projects returned'
        )
      })

      it('should throw error when apollo client returns error', async () => {
        const error = new Error('GraphQL error')

        vi.mocked(apolloClient.query).mockResolvedValue({ error } as any)

        await expect(getFeaturedProjects()).rejects.toThrow('GraphQL error')
      })
    })

    describe('assignProject', () => {
      it('should successfully assign project', async () => {
        const mockProjectId = 'project-1'
        const mockDeveloperId = 'dev-1'
        const mockAssignedProject = createMockProject({
          id: 'project-1',
          title: 'Assigned Project',
        })

        const mockResponse = {
          data: {
            assignProject: mockAssignedProject,
          },
        }

        vi.mocked(apolloClient.mutate).mockResolvedValue(mockResponse)

        const result = await assignProject(mockProjectId, mockDeveloperId)

        expect(apolloClient.mutate).toHaveBeenCalledWith({
          mutation: ASSIGN_PROJECT,
          variables: { projectId: mockProjectId, developerId: mockDeveloperId },
        })
        expect(result).toEqual(mockAssignedProject)
      })

      it('should throw error when no data is returned', async () => {
        const mockProjectId = 'project-1'
        const mockDeveloperId = 'dev-1'

        vi.mocked(apolloClient.mutate).mockResolvedValue({ data: null })

        await expect(
          assignProject(mockProjectId, mockDeveloperId)
        ).rejects.toThrow('No data returned from AssignProject mutation')
      })

      it('should throw error when apollo client returns error', async () => {
        const mockProjectId = 'project-1'
        const mockDeveloperId = 'dev-1'
        const error = new Error('GraphQL error')

        vi.mocked(apolloClient.mutate).mockResolvedValue({ error } as any)

        await expect(
          assignProject(mockProjectId, mockDeveloperId)
        ).rejects.toThrow('GraphQL error')
      })
    })
  })
})
