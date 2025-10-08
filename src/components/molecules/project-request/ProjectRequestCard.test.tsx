import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectStatus, ProjectType } from '@/graphql/generated/graphql'
import { createMockFullProjectRequest } from '@/tests/mocks'

import { ProjectRequestCard } from './ProjectRequestCard'

// Mock RequirementsList component
vi.mock('@/components/molecules', () => ({
  RequirementsList: ({
    requirements,
  }: {
    requirements: string | null | undefined
  }) => (
    <div data-testid='requirements-list'>
      {requirements ? 'Requirements loaded' : 'No requirements'}
    </div>
  ),
}))

const mockProjectRequest = createMockFullProjectRequest({
  projectName: 'test-project-request',
  title: 'Test Project Request',
  description: 'A test project request for testing purposes',
  additionalInfo: 'This is additional information',
  requirements: 'Requirement 1\nRequirement 2\nRequirement 3',
  user: {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  },
})

const mockUpdateStatusAction = vi.fn()
const mockApproveAction = vi.fn()

describe('ProjectRequestCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders project request information correctly', () => {
    render(
      <ProjectRequestCard
        request={mockProjectRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(screen.getByText('Test Project Request')).toBeInTheDocument()
    expect(
      screen.getByText('A test project request for testing purposes')
    ).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => {
        return (
          element?.textContent === 'Client: John Doe (john.doe@example.com)'
        )
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => {
        return element?.textContent === `Type: ${ProjectType.WebApp}`
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => {
        return element?.textContent === 'Budget: $5000'
      })
    ).toBeInTheDocument()
    expect(screen.getByText('3 months')).toBeInTheDocument()
    expect(
      screen.getByText('This is additional information')
    ).toBeInTheDocument()
  })

  it('renders status badge with correct styling', () => {
    render(
      <ProjectRequestCard
        request={mockProjectRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    const statusBadge = screen.getByText('REQUESTED')

    expect(statusBadge).toBeInTheDocument()
    expect(statusBadge).toHaveClass(
      'rounded',
      'border',
      'px-3',
      'py-1',
      'font-mono',
      'text-xs',
      'font-bold',
      'uppercase'
    )
  })

  it('renders requirements list', () => {
    render(
      <ProjectRequestCard
        request={mockProjectRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(screen.getByTestId('requirements-list')).toBeInTheDocument()
    expect(screen.getByText('Requirements loaded')).toBeInTheDocument()
  })

  it('shows correct action buttons for REQUESTED status', () => {
    render(
      <ProjectRequestCard
        request={mockProjectRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(screen.getByText('Start Review')).toBeInTheDocument()
    expect(screen.getByText('Reject')).toBeInTheDocument()
  })

  it('shows correct action buttons for IN_REVIEW status', () => {
    const inReviewRequest = {
      ...mockProjectRequest,
      status: ProjectStatus.InReview,
    }

    render(
      <ProjectRequestCard
        request={inReviewRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(screen.getByText('Approve & Create Project')).toBeInTheDocument()
    expect(screen.getByText('Reject')).toBeInTheDocument()
  })

  it('handles status update action', async () => {
    render(
      <ProjectRequestCard
        request={mockProjectRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    const startReviewButton = screen.getByText('Start Review')
    fireEvent.click(startReviewButton)

    await waitFor(() => {
      expect(mockUpdateStatusAction).toHaveBeenCalledWith(
        '1',
        ProjectStatus.InReview
      )
    })
  })

  it('handles reject action', async () => {
    render(
      <ProjectRequestCard
        request={mockProjectRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    const rejectButton = screen.getByText('Reject')
    fireEvent.click(rejectButton)

    await waitFor(() => {
      expect(mockUpdateStatusAction).toHaveBeenCalledWith(
        '1',
        ProjectStatus.Cancelled
      )
    })
  })

  it('shows approval form when approve button is clicked', () => {
    const inReviewRequest = {
      ...mockProjectRequest,
      status: ProjectStatus.InReview,
    }

    render(
      <ProjectRequestCard
        request={inReviewRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    const approveButton = screen.getByText('Approve & Create Project')
    fireEvent.click(approveButton)

    expect(screen.getByText('Project Approval Details')).toBeInTheDocument()
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Est. Completion Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
    expect(screen.getByLabelText('Budget Override')).toBeInTheDocument()
    expect(screen.getByLabelText('Internal Notes')).toBeInTheDocument()
  })

  it('handles approval form submission', async () => {
    const inReviewRequest = {
      ...mockProjectRequest,
      status: ProjectStatus.InReview,
    }

    render(
      <ProjectRequestCard
        request={inReviewRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    // Open approval form
    const approveButton = screen.getByText('Approve & Create Project')
    fireEvent.click(approveButton)

    // Fill form
    const completionDateInput = screen.getByLabelText('Est. Completion Date')
    fireEvent.change(completionDateInput, { target: { value: '2024-04-15' } })

    const prioritySelect = screen.getByLabelText('Priority')
    fireEvent.change(prioritySelect, { target: { value: 'high' } })

    const budgetInput = screen.getByLabelText('Budget Override')
    fireEvent.change(budgetInput, { target: { value: '6000' } })

    const notesTextarea = screen.getByLabelText('Internal Notes')
    fireEvent.change(notesTextarea, {
      target: { value: 'High priority project' },
    })

    // Submit form
    const submitButton = screen.getByText('Approve & Create Project')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockApproveAction).toHaveBeenCalledWith('1', {
        startDate: expect.any(String),
        estimatedCompletionDate: '2024-04-15',
        priority: 'high',
        techStack: [],
        budget: 6000,
        internalNotes: 'High priority project',
      })
    })
  })

  it('handles approval form cancellation', () => {
    const inReviewRequest = {
      ...mockProjectRequest,
      status: ProjectStatus.InReview,
    }

    render(
      <ProjectRequestCard
        request={inReviewRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    // Open approval form
    const approveButton = screen.getByText('Approve & Create Project')
    fireEvent.click(approveButton)

    expect(screen.getByText('Project Approval Details')).toBeInTheDocument()

    // Cancel form
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(
      screen.queryByText('Project Approval Details')
    ).not.toBeInTheDocument()
  })

  it('handles missing user information gracefully', () => {
    const requestWithoutUser = { ...mockProjectRequest, user: null }

    render(
      <ProjectRequestCard
        request={requestWithoutUser}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(
      screen.getByText((_, element) => {
        return element?.textContent === 'Client: Unknown User ()'
      })
    ).toBeInTheDocument()
  })

  it('handles missing budget gracefully', () => {
    const requestWithoutBudget = { ...mockProjectRequest, budget: null }

    render(
      <ProjectRequestCard
        request={requestWithoutBudget}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(screen.queryByText(/Budget:/)).not.toBeInTheDocument()
  })

  it('handles missing additional info gracefully', () => {
    const requestWithoutAdditionalInfo = {
      ...mockProjectRequest,
      additionalInfo: null,
    }

    render(
      <ProjectRequestCard
        request={requestWithoutAdditionalInfo}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(screen.queryByText('Additional Info:')).not.toBeInTheDocument()
  })

  it('handles missing timeline gracefully', () => {
    const requestWithoutTimeline = { ...mockProjectRequest, timeline: null }

    render(
      <ProjectRequestCard
        request={requestWithoutTimeline}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    expect(screen.queryByText('Timeline:')).not.toBeInTheDocument()
  })

  it('shows loading state during status update', async () => {
    mockUpdateStatusAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <ProjectRequestCard
        request={mockProjectRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    const startReviewButton = screen.getByText('Start Review')
    fireEvent.click(startReviewButton)

    expect(screen.getByText('Updating...')).toBeInTheDocument()
    expect(startReviewButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('Updating...')).not.toBeInTheDocument()
    })
  })

  it('shows loading state during approval', async () => {
    mockApproveAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const inReviewRequest = {
      ...mockProjectRequest,
      status: ProjectStatus.InReview,
    }

    render(
      <ProjectRequestCard
        request={inReviewRequest}
        updateStatusAction={mockUpdateStatusAction}
        approveAction={mockApproveAction}
      />
    )

    // Open approval form
    const approveButton = screen.getByText('Approve & Create Project')
    fireEvent.click(approveButton)

    // Submit form
    const submitButton = screen.getByText('Approve & Create Project')
    fireEvent.click(submitButton)

    expect(screen.getByText('Creating Project...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('Creating Project...')).not.toBeInTheDocument()
    })
  })
})
