import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Project } from '@/graphql/generated/graphql'

import {
  ProjectStatus,
  ProjectType,
  UserRole,
} from '@/graphql/generated/graphql'

import { AvailableProjectCard } from './AvailableProjectCard'

const mockProject: Project = {
  id: '1',
  title: 'Test Project',
  overview: 'A test project overview',
  description: 'A detailed test project description',
  techStack: ['React', 'TypeScript', 'Tailwind'],
  status: ProjectStatus.Requested,
  logo: '/test-logo.png',
  projectName: 'test-project',
  featured: false,
  projectType: ProjectType.WebApp,
  budget: 5000,
  requirements: '{"requirement1": "test"}',
  progressPercentage: 0,
  startDate: '2024-01-01',
  estimatedCompletionDate: '2024-03-01',
  actualCompletionDate: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  clientId: 'client1',
  developerId: null,
  requestId: 'req1',
  client: {
    id: 'client1',
    clerkId: 'client1_clerk',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: UserRole.Client,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  developer: null,
  collaborators: [],
  statusUpdates: [],
}

describe('AvailableProjectCard', () => {
  const mockOnAssignAction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders project title', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('renders project status', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    // The status is displayed in PascalCase from the generated enum
    expect(screen.getByText('Requested')).toBeInTheDocument()
  })

  it('renders client information', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    // Check for client name and email separately since they're in different elements
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders project description', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(
      screen.getByText('A detailed test project description')
    ).toBeInTheDocument()
  })

  it('renders project type', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.getByText('WebApp')).toBeInTheDocument()
  })

  it('renders budget when available', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.getByText('$5000')).toBeInTheDocument()
  })

  it('renders tech stack when available', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
  })

  it('shows tech stack overflow indicator when more than 3 items', () => {
    const projectWithManyTechs = {
      ...mockProject,
      techStack: ['React', 'TypeScript', 'Tailwind', 'Node.js', 'PostgreSQL'],
    }
    render(
      <AvailableProjectCard
        project={projectWithManyTechs}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('renders assign button', () => {
    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    const assignButton = screen.getByRole('button', { name: '🚀 ASSIGN TO ME' })

    expect(assignButton).toBeInTheDocument()
  })

  it('calls onAssignAction when assign button is clicked', async () => {
    mockOnAssignAction.mockResolvedValue(undefined)

    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    const assignButton = screen.getByRole('button', { name: '🚀 ASSIGN TO ME' })
    fireEvent.click(assignButton)

    await waitFor(() => {
      expect(mockOnAssignAction).toHaveBeenCalledWith('1')
    })
  })

  it('shows loading state while assigning', async () => {
    mockOnAssignAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <AvailableProjectCard
        project={mockProject}
        onAssignAction={mockOnAssignAction}
      />
    )

    const assignButton = screen.getByRole('button', { name: '🚀 ASSIGN TO ME' })
    fireEvent.click(assignButton)

    expect(screen.getByText('ASSIGNING...')).toBeInTheDocument()
    expect(assignButton).toBeDisabled()
  })

  it('handles client with only email when name is not available', () => {
    const projectWithEmailOnlyClient = {
      ...mockProject,
      client: {
        ...mockProject.client!,
        firstName: null,
        lastName: null,
      },
    }
    render(
      <AvailableProjectCard
        project={projectWithEmailOnlyClient}
        onAssignAction={mockOnAssignAction}
      />
    )

    // Check for the email in the client name field (first occurrence)
    const clientNameElements = screen.getAllByText('john@example.com')

    expect(clientNameElements.length).toBeGreaterThan(0)
  })

  it('shows unknown client when client info is not available', () => {
    const projectWithoutClient = { ...mockProject, client: null }
    render(
      <AvailableProjectCard
        project={projectWithoutClient}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.getByText('Unknown Client')).toBeInTheDocument()
    expect(screen.getByText('No email available')).toBeInTheDocument()
  })

  it('renders tech stack items correctly', () => {
    const projectWithTechStack = {
      ...mockProject,
      techStack: ['React', 'TypeScript', 'Tailwind'],
    }
    render(
      <AvailableProjectCard
        project={projectWithTechStack}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
  })

  it('does not render budget section when budget is not available', () => {
    const projectWithoutBudget = { ...mockProject, budget: null }
    render(
      <AvailableProjectCard
        project={projectWithoutBudget}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.queryByText('Budget:')).not.toBeInTheDocument()
  })

  it('does not render tech stack section when tech stack is empty', () => {
    const projectWithoutTechStack = { ...mockProject, techStack: [] }
    render(
      <AvailableProjectCard
        project={projectWithoutTechStack}
        onAssignAction={mockOnAssignAction}
      />
    )

    expect(screen.queryByText('Tech Stack:')).not.toBeInTheDocument()
  })
})
