import type {
  DashboardProjectFragment,
  Project,
  ProjectDisplayFragment,
  ProjectRequest,
  ProjectRequestDisplayFragment,
} from '@/graphql/generated/graphql'

import {
  ProjectStatus,
  ProjectType,
  UserRole,
} from '@/graphql/generated/graphql'

/**
 * Creates a mock Project with sensible defaults
 * Override any properties as needed for specific test cases
 */
export const createMockFullProject = (
  overrides: Partial<Project> = {}
): Project => ({
  __typename: 'Project',
  id: '1',
  title: 'Test Project',
  projectName: 'test-project',
  description: 'A test project description',
  overview: 'A test project overview',
  projectType: ProjectType.WebApp,
  status: ProjectStatus.InProgress,
  techStack: ['React', 'TypeScript', 'Tailwind'],
  featured: false,
  logo: '/test-logo.png',
  liveUrl: 'https://testproject.com',
  repositoryUrl: 'https://github.com/testproject',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  clientId: 'client-1',
  developerId: 'developer-1',
  requestId: 'request-1',
  budget: 5000,
  progressPercentage: 50,
  startDate: '2024-01-01',
  estimatedCompletionDate: '2024-03-01',
  actualCompletionDate: null,
  requirements: '{"requirement1": "test"}',
  stagingUrl: 'https://staging.testproject.com',
  client: {
    __typename: 'User',
    id: 'client-1',
    clerkId: 'client1_clerk',
    email: 'client@example.com',
    firstName: 'Test',
    lastName: 'Client',
    role: UserRole.Client,
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  developer: {
    __typename: 'User',
    id: 'developer-1',
    clerkId: 'dev1_clerk',
    email: 'developer@example.com',
    firstName: 'Test',
    lastName: 'Developer',
    role: UserRole.Developer,
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  projectRequest: null,
  collaborators: [],
  statusUpdates: [],
  ...overrides,
})

/**
 * Creates a mock ProjectDisplayFragment with sensible defaults
 * Override any properties as needed for specific test cases
 */
export const createMockProject = (
  overrides: Partial<ProjectDisplayFragment> = {}
): ProjectDisplayFragment => ({
  __typename: 'Project',
  id: '1',
  title: 'Test Project',
  projectName: 'test-project',
  description: 'A test project description',
  overview: 'A test project overview',
  projectType: ProjectType.WebApp,
  status: ProjectStatus.InProgress,
  techStack: ['React', 'TypeScript', 'Tailwind'],
  featured: false,
  logo: '/test-logo.png',
  liveUrl: 'https://testproject.com',
  repositoryUrl: 'https://github.com/testproject',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Creates a mock ProjectRequestDisplayFragment with sensible defaults
 * Override any properties as needed for specific test cases
 */
export const createMockProjectRequest = (
  overrides: Partial<ProjectRequestDisplayFragment> = {}
): ProjectRequestDisplayFragment => ({
  __typename: 'ProjectRequest',
  id: '1',
  projectName: 'test-request',
  title: 'Test Project Request',
  description: 'A test project request description',
  projectType: ProjectType.WebApp,
  budget: 5000,
  timeline: '3 months',
  requirements: 'Test requirements',
  additionalInfo: 'Additional test information',
  status: ProjectStatus.Requested,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  statusUpdates: [],
  user: {
    __typename: 'User',
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  },
  ...overrides,
})

/**
 * Creates a mock ProjectRequest with sensible defaults
 * Override any properties as needed for specific test cases
 */
export const createMockFullProjectRequest = (
  overrides: Partial<ProjectRequest> = {}
): ProjectRequest => ({
  __typename: 'ProjectRequest',
  id: '1',
  projectName: 'test-request',
  title: 'Test Project Request',
  description: 'A test project request description',
  projectType: ProjectType.WebApp,
  budget: 5000,
  timeline: '3 months',
  requirements: 'Test requirements',
  additionalInfo: 'Additional test information',
  contactPreference: 'EMAIL',
  status: ProjectStatus.Requested,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  userId: 'user-1',
  reviewerId: null,
  statusUpdates: [],
  user: {
    __typename: 'User',
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  },
  reviewer: null,
  ...overrides,
})

/**
 * Creates an array of mock projects with different variations
 * Useful for testing lists and filtering
 */
export const createMockProjects = (
  count: number = 3
): ProjectDisplayFragment[] => {
  return Array.from({ length: count }, (_, index) => {
    return createMockProject({
      id: `project-${index + 1}`,
      title: `Test Project ${index + 1}`,
      projectName: `test-project-${index + 1}`,
      status:
        index % 2 === 0 ? ProjectStatus.InProgress : ProjectStatus.Completed,
      featured: index === 0, // First project is featured
    })
  })
}

/**
 * Creates a mock DashboardProjectFragment with sensible defaults
 * Override any properties as needed for specific test cases
 */
export const createMockDashboardProject = (
  overrides: Partial<DashboardProjectFragment> = {}
): DashboardProjectFragment => ({
  __typename: 'Project',
  id: '1',
  projectName: 'test-project',
  title: 'Test Project',
  description: 'A test project description',
  projectType: ProjectType.WebApp,
  status: ProjectStatus.InProgress,
  budget: 5000,
  progressPercentage: 50,
  techStack: ['React', 'TypeScript', 'Tailwind'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  featured: false,
  client: {
    __typename: 'User',
    id: 'client-1',
    firstName: 'Test',
    lastName: 'Client',
    email: 'client@example.com',
  },
  developer: {
    __typename: 'User',
    id: 'developer-1',
    firstName: 'Test',
    lastName: 'Developer',
    email: 'developer@example.com',
  },
  ...overrides,
})

/**
 * Creates an array of mock project requests with different variations
 * Useful for testing lists and filtering
 */
export const createMockProjectRequests = (
  count: number = 3
): ProjectRequestDisplayFragment[] => {
  return Array.from({ length: count }, (_, index) => {
    return createMockProjectRequest({
      id: `request-${index + 1}`,
      title: `Test Request ${index + 1}`,
      projectName: `test-request-${index + 1}`,
      status:
        index % 2 === 0 ? ProjectStatus.Requested : ProjectStatus.InReview,
      budget: 5000 + index * 1000,
    })
  })
}
