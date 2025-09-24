import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { StatusUpdate } from '@/graphql/generated/graphql'

import { ProjectStatus } from '@/graphql/generated/graphql'

import { StatusHistory } from './StatusHistory'

const mockStatusUpdates: StatusUpdate[] = [
  {
    id: '1',
    entityId: 'project-1',
    entityType: 'Project',
    oldStatus: ProjectStatus.InProgress,
    newStatus: ProjectStatus.Completed,
    updateMessage: 'Project completed successfully',
    progressPercentage: 100,
    isClientVisible: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedBy: 'user1',
    updatedByUser: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  },
  {
    id: '2',
    entityId: 'project-1',
    entityType: 'Project',
    oldStatus: ProjectStatus.Requested,
    newStatus: ProjectStatus.InProgress,
    updateMessage: 'Development started',
    progressPercentage: 25,
    isClientVisible: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedBy: 'user2',
    updatedByUser: {
      id: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    },
  },
  {
    id: '3',
    entityId: 'project-1',
    entityType: 'Project',
    oldStatus: null,
    newStatus: ProjectStatus.Requested,
    updateMessage: 'Project planning phase initiated',
    progressPercentage: 0,
    isClientVisible: true,
    createdAt: '2024-01-05T08:00:00Z',
    updatedBy: 'user1',
    updatedByUser: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  },
]

describe('StatusHistory', () => {
  it('renders status history with correct title', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    expect(screen.getByText('STATUS HISTORY')).toBeInTheDocument()
  })

  it('renders all status updates in correct order (most recent first)', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    const statusMessages = screen.getAllByText(
      /Project completed successfully|Development started|Project planning phase initiated/
    )

    expect(statusMessages).toHaveLength(3)

    // Most recent should be first
    expect(statusMessages[0]).toHaveTextContent(
      'Project completed successfully'
    )
  })

  it('renders status badges with old and new status', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    // Check for status badges (they are formatted with spaces)
    expect(screen.getAllByText('I N_ P R O G R E S S')).toHaveLength(2) // Appears twice
    expect(screen.getByText('C O M P L E T E D')).toBeInTheDocument()
    expect(screen.getAllByText('P L A N N I N G')).toHaveLength(2) // Appears twice
  })

  it('renders progress percentage when available', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders update messages', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    expect(
      screen.getByText('Project completed successfully')
    ).toBeInTheDocument()
    expect(screen.getByText('Development started')).toBeInTheDocument()
    expect(
      screen.getByText('Project planning phase initiated')
    ).toBeInTheDocument()
  })

  it('renders user information when available', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    expect(screen.getAllByText('by John Doe')).toHaveLength(2) // Two updates by John Doe
    expect(screen.getByText('by Jane Smith')).toBeInTheDocument()
  })

  it('renders timeline dots and lines correctly', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    // Should have 3 timeline dots (one for each update)
    const timelineDots = screen
      .getAllByRole('generic')
      .filter(
        (el) =>
          el.classList.contains('rounded-full') &&
          el.classList.contains('border-green-400/40')
      )

    expect(timelineDots).toHaveLength(3)
  })

  it('renders status transition arrows', () => {
    render(<StatusHistory statusUpdates={mockStatusUpdates} />)

    // Should have arrows for updates with old status
    const arrows = screen.getAllByText('→')

    expect(arrows).toHaveLength(2) // Two updates have old status
  })

  it('returns null when no status updates provided', () => {
    const { container } = render(<StatusHistory statusUpdates={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it('returns null when status updates is null', () => {
    const { container } = render(<StatusHistory statusUpdates={null as any} />)

    expect(container.firstChild).toBeNull()
  })

  it('filters out null and undefined updates', () => {
    const updatesWithNulls = [
      mockStatusUpdates[0],
      null,
      mockStatusUpdates[1],
      undefined,
      mockStatusUpdates[2],
    ]

    render(<StatusHistory statusUpdates={updatesWithNulls as any} />)

    // Should still render all valid updates
    expect(
      screen.getByText('Project completed successfully')
    ).toBeInTheDocument()
    expect(screen.getByText('Development started')).toBeInTheDocument()
    expect(
      screen.getByText('Project planning phase initiated')
    ).toBeInTheDocument()
  })

  it('handles updates without old status', () => {
    const updateWithoutOldStatus: StatusUpdate = {
      id: '4',
      entityId: 'project-1',
      entityType: 'Project',
      oldStatus: null,
      newStatus: ProjectStatus.Cancelled,
      updateMessage: 'Project was cancelled',
      progressPercentage: null,
      isClientVisible: true,
      createdAt: '2024-01-20T11:00:00Z',
      updatedBy: 'system',
      updatedByUser: null,
    }

    render(<StatusHistory statusUpdates={[updateWithoutOldStatus]} />)

    expect(screen.getByText('C A N C E L L E D')).toBeInTheDocument()
    expect(screen.getByText('Project was cancelled')).toBeInTheDocument()
    // Should not have an arrow since there's no old status
    expect(screen.queryByText('→')).not.toBeInTheDocument()
  })

  it('handles updates without user information', () => {
    const updateWithoutUser: StatusUpdate = {
      id: '5',
      entityId: 'project-1',
      entityType: 'Project',
      oldStatus: ProjectStatus.Requested,
      newStatus: ProjectStatus.Cancelled,
      updateMessage: 'Project cancelled by system',
      progressPercentage: null,
      isClientVisible: true,
      createdAt: '2024-01-20T11:00:00Z',
      updatedBy: 'system',
      updatedByUser: null,
    }

    render(<StatusHistory statusUpdates={[updateWithoutUser]} />)

    expect(screen.getByText('Project cancelled by system')).toBeInTheDocument()
    // Should not show user attribution since there's no user
    expect(screen.queryByText(/by John|by Jane/)).not.toBeInTheDocument()
  })

  it('handles updates without progress percentage', () => {
    const updateWithoutProgress: StatusUpdate = {
      id: '6',
      entityId: 'project-1',
      entityType: 'Project',
      oldStatus: ProjectStatus.Requested,
      newStatus: ProjectStatus.Cancelled,
      updateMessage: 'Project cancelled',
      progressPercentage: null,
      isClientVisible: true,
      createdAt: '2024-01-20T11:00:00Z',
      updatedBy: 'user1',
      updatedByUser: {
        id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
    }

    render(<StatusHistory statusUpdates={[updateWithoutProgress]} />)

    expect(screen.getByText('Project cancelled')).toBeInTheDocument()
    // Should not show percentage since it's null
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})
