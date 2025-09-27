import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type {
  DashboardProjectFragment,
  ProjectRequestDisplayFragment,
} from '@/graphql/generated/graphql'

import { ProjectStatus, ProjectType } from '@/graphql/generated/graphql'

import { UserProjectsAndRequests } from './UserProjectsAndRequests'

// Mock ProjectStatusCard component
vi.mock('@/components/molecules', () => ({
  ProjectStatusCard: ({ item }: any) => (
    <div data-testid={`project-status-card-${item.id}`}>
      <div data-testid='item-title'>{item.title}</div>
      <div data-testid='item-status'>{item.status}</div>
      <div data-testid='item-type'>{item.__typename}</div>
    </div>
  ),
}))

const mockProjects: DashboardProjectFragment[] = [
  {
    id: 'project1',
    projectName: 'test-project-1',
    title: 'Test Project 1',
    description: 'First test project',
    projectType: ProjectType.WebApp,
    status: ProjectStatus.InProgress,
    budget: 5000,
    timeline: '3 months',
    requirements: 'Requirements for project 1',
    featured: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    requestId: 'request1',
    __typename: 'Project',
  } as DashboardProjectFragment,
  {
    id: 'project2',
    projectName: 'test-project-2',
    title: 'Test Project 2',
    description: 'Second test project',
    projectType: ProjectType.MobileApp,
    status: ProjectStatus.Completed,
    budget: 8000,
    timeline: '4 months',
    requirements: 'Requirements for project 2',
    featured: false,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    requestId: 'request2',
    __typename: 'Project',
  } as DashboardProjectFragment,
]

const mockProjectRequests: ProjectRequestDisplayFragment[] = [
  {
    id: 'request1',
    projectName: 'test-request-1',
    title: 'Test Request 1',
    description: 'First test request',
    projectType: ProjectType.WebApp,
    status: ProjectStatus.Requested,
    budget: 3000,
    timeline: '2 months',
    requirements: 'Requirements for request 1',
    statusUpdates: [],
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
    __typename: 'ProjectRequest',
  } as ProjectRequestDisplayFragment,
  {
    id: 'request2',
    projectName: 'test-request-2',
    title: 'Test Request 2',
    description: 'Second test request',
    projectType: ProjectType.MobileApp,
    status: ProjectStatus.InReview,
    budget: 6000,
    timeline: '3 months',
    requirements: 'Requirements for request 2',
    statusUpdates: [],
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z',
    __typename: 'ProjectRequest',
  } as ProjectRequestDisplayFragment,
  {
    id: 'request3',
    projectName: 'test-request-3',
    title: 'Test Request 3',
    description: 'Third test request',
    projectType: ProjectType.WebApp,
    status: ProjectStatus.Approved,
    budget: 4000,
    timeline: '2 months',
    requirements: 'Requirements for request 3',
    statusUpdates: [],
    createdAt: '2024-01-19T10:00:00Z',
    updatedAt: '2024-01-19T10:00:00Z',
    __typename: 'ProjectRequest',
  } as ProjectRequestDisplayFragment,
]

describe('UserProjectsAndRequests', () => {
  it('renders projects section with projects', () => {
    render(
      <UserProjectsAndRequests projects={mockProjects} projectRequests={[]} />
    )

    expect(screen.getByText('🚀 YOUR PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-project1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-project2')
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('item-title')[0]).toHaveTextContent(
      'Test Project 1'
    )
    expect(screen.getAllByTestId('item-type')[0]).toHaveTextContent('Project')
  })

  it('renders empty state for projects when none exist', () => {
    render(<UserProjectsAndRequests projects={[]} projectRequests={[]} />)

    expect(screen.getByText('🚀 YOUR PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByText('🚀')).toBeInTheDocument()
  })

  it('renders project requests section with requests', () => {
    render(
      <UserProjectsAndRequests
        projects={[]}
        projectRequests={mockProjectRequests}
      />
    )

    expect(screen.getByText('📋 YOUR REQUESTS')).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-request1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-request2')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-request3')
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('item-type')[0]).toHaveTextContent(
      'ProjectRequest'
    )
  })

  it('renders empty state for project requests when none exist', () => {
    render(<UserProjectsAndRequests projects={[]} projectRequests={[]} />)

    expect(screen.getByText('📋 YOUR REQUESTS')).toBeInTheDocument()
    expect(screen.getByText('No pending requests')).toBeInTheDocument()
    expect(screen.getByText('📋')).toBeInTheDocument()
  })

  it('filters out approved project requests that exist as projects', () => {
    // Create a scenario where request1 has been approved and exists as project1
    const projectsWithRequestId: DashboardProjectFragment[] = [
      {
        ...mockProjects[0],
        requestId: 'request1', // This request should be filtered out
      } as DashboardProjectFragment,
    ]

    const allRequests = mockProjectRequests

    render(
      <UserProjectsAndRequests
        projects={projectsWithRequestId}
        projectRequests={allRequests}
      />
    )

    // Should show project1
    expect(
      screen.getByTestId('project-status-card-project1')
    ).toBeInTheDocument()

    // Should show request2 and request3, but NOT request1 (since it's approved and exists as project1)
    expect(
      screen.getByTestId('project-status-card-request2')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-request3')
    ).toBeInTheDocument()

    // request1 should not be in the requests section since it's been approved
    expect(
      screen.queryByTestId('project-status-card-request1')
    ).not.toBeInTheDocument()
  })

  it('handles undefined projects gracefully', () => {
    render(
      <UserProjectsAndRequests projects={undefined} projectRequests={[]} />
    )

    expect(screen.getByText('No projects yet')).toBeInTheDocument()
  })

  it('handles undefined project requests gracefully', () => {
    render(
      <UserProjectsAndRequests projects={[]} projectRequests={undefined} />
    )

    expect(screen.getByText('No pending requests')).toBeInTheDocument()
  })

  it('handles both undefined props gracefully', () => {
    render(
      <UserProjectsAndRequests
        projects={undefined}
        projectRequests={undefined}
      />
    )

    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByText('No pending requests')).toBeInTheDocument()
  })

  it('renders both sections when both have data', () => {
    render(
      <UserProjectsAndRequests
        projects={mockProjects}
        projectRequests={mockProjectRequests}
      />
    )

    // Projects section
    expect(screen.getByText('🚀 YOUR PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-project1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-project2')
    ).toBeInTheDocument()

    // Requests section - request1 and request2 should be filtered out because project1 and project2 have requestId: 'request1' and 'request2'
    expect(screen.getByText('📋 YOUR REQUESTS')).toBeInTheDocument()
    expect(
      screen.queryByTestId('project-status-card-request1')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('project-status-card-request2')
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-request3')
    ).toBeInTheDocument()
  })

  it('renders both empty states when no data exists', () => {
    render(<UserProjectsAndRequests projects={[]} projectRequests={[]} />)

    // Projects empty state
    expect(screen.getByText('🚀 YOUR PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('No projects yet')).toBeInTheDocument()

    // Requests empty state
    expect(screen.getByText('📋 YOUR REQUESTS')).toBeInTheDocument()
    expect(screen.getByText('No pending requests')).toBeInTheDocument()
  })

  it('filters multiple approved requests correctly', () => {
    const projectsWithMultipleRequestIds: DashboardProjectFragment[] = [
      {
        ...mockProjects[0],
        requestId: 'request1',
      } as DashboardProjectFragment,
      {
        ...mockProjects[1],
        requestId: 'request2',
      } as DashboardProjectFragment,
    ]

    render(
      <UserProjectsAndRequests
        projects={projectsWithMultipleRequestIds}
        projectRequests={mockProjectRequests}
      />
    )

    // Should show both projects
    expect(
      screen.getByTestId('project-status-card-project1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-project2')
    ).toBeInTheDocument()

    // Should only show request3 (request1 and request2 are filtered out)
    const requestCards = screen.getAllByTestId(/project-status-card-request/)

    expect(requestCards).toHaveLength(1)
    expect(
      screen.getByTestId('project-status-card-request3')
    ).toBeInTheDocument()
  })

  it('handles projects without requestId correctly', () => {
    const projectsWithoutRequestId: DashboardProjectFragment[] = [
      {
        ...mockProjects[0],
        requestId: null, // No requestId
      } as DashboardProjectFragment,
    ]

    render(
      <UserProjectsAndRequests
        projects={projectsWithoutRequestId}
        projectRequests={mockProjectRequests}
      />
    )

    // Should show the project
    expect(
      screen.getByTestId('project-status-card-project1')
    ).toBeInTheDocument()

    // Should show all requests since project1 has no requestId
    expect(
      screen.getByTestId('project-status-card-request1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-request2')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-request3')
    ).toBeInTheDocument()
  })

  it('generates unique keys for mixed content', () => {
    render(
      <UserProjectsAndRequests
        projects={mockProjects}
        projectRequests={mockProjectRequests}
      />
    )

    // All cards should be rendered with unique keys
    // request1 and request2 should be filtered out because project1 and project2 have requestId: 'request1' and 'request2'
    const allCards = screen.getAllByTestId(/project-status-card-/)

    expect(allCards).toHaveLength(3) // 2 projects + 1 request (request1 and request2 filtered out)
  })
})
