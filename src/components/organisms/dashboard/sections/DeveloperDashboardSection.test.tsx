import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  ProjectStatus,
  ProjectType,
  UserRole,
} from '@/graphql/generated/graphql'

import { DeveloperDashboardSection } from './DeveloperDashboardSection'

// Mock API clients
const mockGetMe = vi.fn()
const mockAssignProject = vi.fn()

vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useGetMe: () => mockGetMe(),
    useAssignProject: () => [mockAssignProject],
  }
})

// Mock Toast
vi.mock('@/libs/Toast', () => ({
  Toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock child components
vi.mock('@/components/molecules', () => ({
  AvailableProjectCard: ({ project, onAssignAction }: any) => (
    <div data-testid={`available-project-card-${project.id}`}>
      <div data-testid='project-title'>{project.title}</div>
      <button
        onClick={() => onAssignAction(project.id)}
        data-testid='assign-button'
      >
        Assign to Project
      </button>
    </div>
  ),
  ProjectStatusCard: ({ item }: any) => (
    <div data-testid={`project-status-card-${item.id}`}>
      <div data-testid='item-title'>{item.title}</div>
      <div data-testid='item-status'>{item.status}</div>
    </div>
  ),
}))

const mockAvailableProjects = [
  {
    id: 'available1',
    projectName: 'available-project-1',
    title: 'Available Project 1',
    description: 'First available project',
    projectType: ProjectType.WebApp,
    status: ProjectStatus.Requested,
    budget: 5000,
    timeline: '3 months',
    requirements: 'Requirements for project 1',
    featured: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'available2',
    projectName: 'available-project-2',
    title: 'Available Project 2',
    description: 'Second available project',
    projectType: ProjectType.MobileApp,
    status: ProjectStatus.Requested,
    budget: 8000,
    timeline: '4 months',
    requirements: 'Requirements for project 2',
    featured: false,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
]

const mockAssignedProjects = [
  {
    id: 'assigned1',
    projectName: 'assigned-project-1',
    title: 'Assigned Project 1',
    description: 'First assigned project',
    projectType: ProjectType.WebApp,
    status: ProjectStatus.InProgress,
    budget: 6000,
    timeline: '3 months',
    requirements: 'Requirements for assigned project 1',
    featured: false,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
  },
]

const mockUser = {
  id: 'user1',
  role: UserRole.Developer,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
}

describe('DeveloperDashboardSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders available projects section with projects', () => {
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })

    render(
      <DeveloperDashboardSection
        availableProjects={mockAvailableProjects}
        assignedProjects={[]}
        onDataRefreshAction={vi.fn()}
      />
    )

    expect(screen.getByText('🔍 AVAILABLE PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByTestId('available-project-card-available1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('available-project-card-available2')
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('project-title')[0]).toHaveTextContent(
      'Available Project 1'
    )
  })

  it('renders empty state for available projects when none exist', () => {
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })

    render(
      <DeveloperDashboardSection
        availableProjects={[]}
        assignedProjects={[]}
        onDataRefreshAction={vi.fn()}
      />
    )

    expect(screen.getByText('🔍 AVAILABLE PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByText('No available projects at the moment')
    ).toBeInTheDocument()
    expect(screen.getByText('🔍')).toBeInTheDocument()
  })

  it('renders assigned projects section with projects', () => {
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })

    render(
      <DeveloperDashboardSection
        availableProjects={[]}
        assignedProjects={mockAssignedProjects}
        onDataRefreshAction={vi.fn()}
      />
    )

    expect(screen.getByText('⚡ ASSIGNED PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-assigned1')
    ).toBeInTheDocument()
    expect(screen.getByTestId('item-title')).toHaveTextContent(
      'Assigned Project 1'
    )
    expect(screen.getByTestId('item-status')).toHaveTextContent('InProgress')
  })

  it('renders empty state for assigned projects when none exist', () => {
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })

    render(
      <DeveloperDashboardSection
        availableProjects={[]}
        assignedProjects={[]}
        onDataRefreshAction={vi.fn()}
      />
    )

    expect(screen.getByText('⚡ ASSIGNED PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('No assigned projects yet')).toBeInTheDocument()
    expect(screen.getByText('⚡')).toBeInTheDocument()
  })

  it('handles project assignment successfully', async () => {
    const mockOnDataRefreshAction = vi.fn()
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })
    mockAssignProject.mockResolvedValue({})

    render(
      <DeveloperDashboardSection
        availableProjects={mockAvailableProjects}
        assignedProjects={[]}
        onDataRefreshAction={mockOnDataRefreshAction}
      />
    )

    const assignButton = screen.getAllByTestId('assign-button')[0]!
    fireEvent.click(assignButton)

    await waitFor(() => {
      expect(mockAssignProject).toHaveBeenCalledWith({
        variables: { projectId: 'available1', developerId: 'user1' },
      })
    })

    expect(mockOnDataRefreshAction).toHaveBeenCalled()
  })

  it('handles project assignment error when user not authenticated', async () => {
    mockGetMe.mockReturnValue({
      data: { me: null },
    })

    render(
      <DeveloperDashboardSection
        availableProjects={mockAvailableProjects}
        assignedProjects={[]}
        onDataRefreshAction={vi.fn()}
      />
    )

    const assignButton = screen.getAllByTestId('assign-button')[0]!
    fireEvent.click(assignButton)

    await waitFor(() => {
      expect(mockAssignProject).not.toHaveBeenCalled()
    })
  })

  it('handles project assignment error when API call fails', async () => {
    const mockOnDataRefreshAction = vi.fn()
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })
    mockAssignProject.mockRejectedValue(new Error('Assignment failed'))

    render(
      <DeveloperDashboardSection
        availableProjects={mockAvailableProjects}
        assignedProjects={[]}
        onDataRefreshAction={mockOnDataRefreshAction}
      />
    )

    const assignButton = screen.getAllByTestId('assign-button')[0]!
    fireEvent.click(assignButton)

    await waitFor(() => {
      expect(mockAssignProject).toHaveBeenCalled()
    })

    // Should not call refresh action on error
    expect(mockOnDataRefreshAction).not.toHaveBeenCalled()
  })

  it('renders both sections when both have projects', () => {
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })

    render(
      <DeveloperDashboardSection
        availableProjects={mockAvailableProjects}
        assignedProjects={mockAssignedProjects}
        onDataRefreshAction={vi.fn()}
      />
    )

    // Available projects section
    expect(screen.getByText('🔍 AVAILABLE PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByTestId('available-project-card-available1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('available-project-card-available2')
    ).toBeInTheDocument()

    // Assigned projects section
    expect(screen.getByText('⚡ ASSIGNED PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByTestId('project-status-card-assigned1')
    ).toBeInTheDocument()
  })

  it('renders both empty states when no projects exist', () => {
    mockGetMe.mockReturnValue({
      data: { me: mockUser },
    })

    render(
      <DeveloperDashboardSection
        availableProjects={[]}
        assignedProjects={[]}
        onDataRefreshAction={vi.fn()}
      />
    )

    // Available projects empty state
    expect(screen.getByText('🔍 AVAILABLE PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByText('No available projects at the moment')
    ).toBeInTheDocument()

    // Assigned projects empty state
    expect(screen.getByText('⚡ ASSIGNED PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('No assigned projects yet')).toBeInTheDocument()
  })
})
