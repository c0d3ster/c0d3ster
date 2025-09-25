import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type {
  DashboardProjectFragment,
  ProjectRequestDisplayFragment,
} from '@/graphql/generated/graphql'

import { ProjectStatus, ProjectType } from '@/graphql/generated/graphql'
import { formatStatus } from '@/utils/Project'

import { ProjectStatusCard } from './ProjectStatusCard'

const mockProject: DashboardProjectFragment = {
  __typename: 'Project',
  id: '1',
  projectName: 'test-project',
  title: 'Test Project',
  description: 'A test project for testing purposes',
  projectType: ProjectType.WebApp,
  status: ProjectStatus.InProgress,
  budget: 5000,
  progressPercentage: 75,
  techStack: ['React', 'TypeScript', 'Node.js'],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  featured: false,
  client: {
    id: 'client1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  },
  developer: {
    id: 'dev1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
}

const mockProjectRequest: ProjectRequestDisplayFragment = {
  __typename: 'ProjectRequest',
  id: '2',
  projectName: 'test-request',
  title: 'Test Request',
  description: 'A test project request for testing purposes',
  projectType: ProjectType.MobileApp,
  status: ProjectStatus.Requested,
  budget: 3000,
  timeline: '2 months',
  additionalInfo: 'This is additional information',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
  statusUpdates: [],
  user: {
    id: 'user1',
    firstName: 'Bob',
    lastName: 'Client',
    email: 'bob.client@example.com',
  },
}

describe('ProjectStatusCard', () => {
  it('renders project information correctly', () => {
    render(<ProjectStatusCard item={mockProject} />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(
      screen.getByText('A test project for testing purposes')
    ).toBeInTheDocument()
    expect(screen.getByText(ProjectType.WebApp)).toBeInTheDocument()
    expect(screen.getByText('$5000')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders project request information correctly', () => {
    render(<ProjectStatusCard item={mockProjectRequest} />)

    expect(screen.getByText('Test Request')).toBeInTheDocument()
    expect(
      screen.getByText('A test project request for testing purposes')
    ).toBeInTheDocument()
    expect(screen.getByText(ProjectType.MobileApp)).toBeInTheDocument()
    expect(screen.getByText('$3000')).toBeInTheDocument()
    expect(screen.getByText('2 months')).toBeInTheDocument()
  })

  it('renders status badge with correct styling', () => {
    render(<ProjectStatusCard item={mockProject} />)

    const statusBadge = screen.getByText(formatStatus(ProjectStatus.InProgress))

    expect(statusBadge).toBeInTheDocument()
    expect(statusBadge.closest('div')).toHaveClass(
      'rounded-full',
      'border',
      'px-2',
      'py-1',
      'font-mono',
      'text-xs',
      'font-bold'
    )
  })

  it('renders client information for projects', () => {
    render(<ProjectStatusCard item={mockProject} />)

    expect(screen.getByText('Client:')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
  })

  it('renders assigned project indicator', () => {
    render(<ProjectStatusCard item={mockProject} />)

    expect(screen.getByText('ASSIGNED')).toBeInTheDocument()
  })

  it('renders tech stack for projects', () => {
    render(<ProjectStatusCard item={mockProject} />)

    expect(screen.getByText('Tech Stack:')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
  })

  it('shows additional info for project requests', () => {
    render(<ProjectStatusCard item={mockProjectRequest} />)

    expect(screen.getByText('Notes:')).toBeInTheDocument()
    expect(
      screen.getByText('This is additional information')
    ).toBeInTheDocument()
  })

  it('renders correct action link for projects', () => {
    render(<ProjectStatusCard item={mockProject} />)

    const viewLink = screen.getByText('VIEW DETAILS')

    expect(viewLink).toBeInTheDocument()
    expect(viewLink.closest('a')).toHaveAttribute(
      'href',
      '/projects/test-project'
    )
  })

  it('renders correct action link for project requests', () => {
    render(<ProjectStatusCard item={mockProjectRequest} />)

    const viewLink = screen.getByText('VIEW REQUEST')

    expect(viewLink).toBeInTheDocument()
    expect(viewLink.closest('a')).toHaveAttribute(
      'href',
      '/projects/test-request'
    )
  })

  it('handles missing client information gracefully', () => {
    const projectWithoutClient = { ...mockProject, client: null }
    render(<ProjectStatusCard item={projectWithoutClient} />)

    expect(screen.queryByText('Client:')).not.toBeInTheDocument()
  })

  it('handles missing budget gracefully', () => {
    const projectWithoutBudget = { ...mockProject, budget: null }
    render(<ProjectStatusCard item={projectWithoutBudget} />)

    expect(screen.queryByText(/Budget:/)).not.toBeInTheDocument()
  })

  it('handles missing tech stack gracefully', () => {
    const projectWithoutTechStack = { ...mockProject, techStack: null }
    render(<ProjectStatusCard item={projectWithoutTechStack} />)

    expect(screen.queryByText('Tech Stack:')).not.toBeInTheDocument()
  })

  it('handles empty tech stack gracefully', () => {
    const projectWithEmptyTechStack = { ...mockProject, techStack: [] }
    render(<ProjectStatusCard item={projectWithEmptyTechStack} />)

    expect(screen.queryByText('Tech Stack:')).not.toBeInTheDocument()
  })

  it('shows limited tech stack items with overflow indicator', () => {
    const projectWithManyTechItems = {
      ...mockProject,
      techStack: [
        'React',
        'TypeScript',
        'Node.js',
        'Express',
        'MongoDB',
        'Docker',
      ],
    }
    render(<ProjectStatusCard item={projectWithManyTechItems} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('handles missing progress percentage gracefully', () => {
    const projectWithoutProgress = { ...mockProject, progressPercentage: null }
    render(<ProjectStatusCard item={projectWithoutProgress} />)

    expect(screen.queryByText(/Progress:/)).not.toBeInTheDocument()
  })

  it('handles missing additional info for project requests gracefully', () => {
    const requestWithoutAdditionalInfo = {
      ...mockProjectRequest,
      additionalInfo: null,
    }
    render(<ProjectStatusCard item={requestWithoutAdditionalInfo} />)

    expect(screen.queryByText('Notes:')).not.toBeInTheDocument()
  })

  it('handles missing timeline for project requests gracefully', () => {
    const requestWithoutTimeline = { ...mockProjectRequest, timeline: null }
    render(<ProjectStatusCard item={requestWithoutTimeline} />)

    expect(screen.queryByText(/Timeline:/)).not.toBeInTheDocument()
  })

  it('handles string client information', () => {
    const projectWithStringClient = {
      ...mockProject,
      client: {
        id: 'client-string',
        firstName: 'Client',
        lastName: 'Name',
        email: 'client.name@example.com',
      },
    }
    render(<ProjectStatusCard item={projectWithStringClient} />)

    expect(screen.getByText('Client:')).toBeInTheDocument()
    expect(screen.getByText('Client Name')).toBeInTheDocument()
  })

  it('renders footer information correctly', () => {
    render(<ProjectStatusCard item={mockProject} />)

    expect(screen.getByText('Project • Jan 15, 2024')).toBeInTheDocument()
  })

  it('renders footer information correctly for project requests', () => {
    render(<ProjectStatusCard item={mockProjectRequest} />)

    expect(screen.getByText('Request • Jan 10, 2024')).toBeInTheDocument()
  })
})
