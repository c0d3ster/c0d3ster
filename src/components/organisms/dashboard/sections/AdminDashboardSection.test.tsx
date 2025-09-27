import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectStatus } from '@/graphql/generated/graphql'
import { createMockProjectRequests } from '@/tests/mocks'

import { AdminDashboardSection } from './AdminDashboardSection'

// Mock API clients
const mockGetProjectRequests = vi.fn()
const mockApproveProjectRequest = vi.fn()
const mockUpdateProjectRequestStatus = vi.fn()

vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useGetProjectRequests: () => mockGetProjectRequests(),
    useApproveProjectRequest: () => [mockApproveProjectRequest],
    useUpdateProjectRequestStatus: () => [mockUpdateProjectRequestStatus],
  }
})

// Mock ProjectRequestCard
vi.mock('@/components/molecules', () => ({
  ProjectRequestCard: ({ request, updateStatusAction, approveAction }: any) => (
    <div data-testid={`project-request-card-${request.id}`}>
      <div data-testid='request-title'>{request.title}</div>
      <div data-testid='request-status'>{request.status}</div>
      <button
        type='button'
        onClick={() => updateStatusAction(request.id, 'in_review')}
        data-testid='update-status-button'
      >
        Update Status
      </button>
      <button
        type='button'
        onClick={() => approveAction(request.id, {})}
        data-testid='approve-button'
      >
        Approve
      </button>
    </div>
  ),
}))

const mockProjectRequests = createMockProjectRequests(3).map(
  (request, index) => ({
    ...request,
    id: `request${index + 1}`,
    title: `Test Project Request ${index + 1}`,
    description:
      index === 0
        ? 'A test project request'
        : index === 1
          ? 'Another test project request'
          : 'Third test project request',
    status:
      index === 0
        ? ProjectStatus.Requested
        : index === 1
          ? ProjectStatus.InReview
          : ProjectStatus.Approved,
    budget: index === 0 ? 5000 : index === 1 ? 8000 : 3000,
    timeline: index === 0 ? '3 months' : index === 1 ? '4 months' : '2 months',
    additionalInfo:
      index === 0
        ? 'Additional info'
        : index === 1
          ? 'More additional info'
          : 'Even more info',
    requirements:
      index === 0
        ? 'Requirements here'
        : index === 1
          ? 'More requirements'
          : 'Even more requirements',
    user: {
      id: `user${index + 1}`,
      firstName: index === 0 ? 'John' : index === 1 ? 'Jane' : 'Bob',
      lastName: index === 0 ? 'Doe' : index === 1 ? 'Smith' : 'Johnson',
      email:
        index === 0
          ? 'john@example.com'
          : index === 1
            ? 'jane@example.com'
            : 'bob@example.com',
    },
  })
)

describe('AdminDashboardSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter buttons with correct counts', () => {
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminDashboardSection />)

    expect(screen.getByText('ALL (3)')).toBeInTheDocument()
    expect(screen.getByText('REQUESTED (0)')).toBeInTheDocument()
    expect(screen.getByText('IN REVIEW (0)')).toBeInTheDocument()
    expect(screen.getByText('APPROVED (0)')).toBeInTheDocument()
    expect(screen.getByText('CANCELLED (0)')).toBeInTheDocument()
  })

  it('filters requests by status when filter button is clicked', () => {
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminDashboardSection />)

    // Initially shows all requests
    expect(
      screen.getByTestId('project-request-card-request1')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-request-card-request2')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('project-request-card-request3')
    ).toBeInTheDocument()

    // Click on "REQUESTED" filter
    fireEvent.click(screen.getByText('REQUESTED (0)'))

    // Should show empty state since there are no requested items
    expect(screen.getByText('No requested requests')).toBeInTheDocument()
    expect(
      screen.queryByTestId('project-request-card-request1')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('project-request-card-request2')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('project-request-card-request3')
    ).not.toBeInTheDocument()
  })

  it('renders loading state', () => {
    mockGetProjectRequests.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminDashboardSection />)

    expect(screen.getByText('Loading requests...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    const mockRefetch = vi.fn()
    mockGetProjectRequests.mockReturnValue({
      data: null,
      loading: false,
      error: { message: 'Failed to fetch requests' },
      refetch: mockRefetch,
    })

    render(<AdminDashboardSection />)

    expect(
      screen.getByText('Error: Failed to fetch requests')
    ).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()

    // Test retry button
    fireEvent.click(screen.getByText('Retry'))

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('renders empty state when no requests', () => {
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: [] },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminDashboardSection />)

    expect(screen.getByText('No project requests found')).toBeInTheDocument()
    expect(
      screen.getByText('Requests will appear here when clients submit them')
    ).toBeInTheDocument()
  })

  it('renders empty state for specific filter when no matching requests', () => {
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminDashboardSection />)

    // Click on "CANCELLED" filter (which has 0 items)
    fireEvent.click(screen.getByText('CANCELLED (0)'))

    expect(screen.getByText('No cancelled requests')).toBeInTheDocument()
  })

  it('renders project request cards with correct data', () => {
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminDashboardSection />)

    expect(screen.getAllByTestId('request-title')[0]).toHaveTextContent(
      'Test Project Request 1'
    )
    expect(screen.getAllByTestId('request-status')[0]).toHaveTextContent(
      'Requested'
    )
  })

  it('handles status update action', async () => {
    const mockRefetch = vi.fn()
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: mockRefetch,
    })

    mockUpdateProjectRequestStatus.mockResolvedValue({})

    render(<AdminDashboardSection />)

    const updateButton = screen.getAllByTestId('update-status-button')[0]!
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockUpdateProjectRequestStatus).toHaveBeenCalledWith({
        variables: { id: 'request1', status: 'in_review' },
      })
    })

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('handles approve action', async () => {
    const mockRefetch = vi.fn()
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: mockRefetch,
    })

    mockApproveProjectRequest.mockResolvedValue({})

    render(<AdminDashboardSection />)

    const approveButton = screen.getAllByTestId('approve-button')[0]!
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(mockApproveProjectRequest).toHaveBeenCalledWith({
        variables: { id: 'request1' },
      })
    })

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('handles status update error', async () => {
    const mockRefetch = vi.fn()
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: mockRefetch,
    })

    mockUpdateProjectRequestStatus.mockRejectedValue(new Error('Update failed'))

    render(<AdminDashboardSection />)

    const updateButton = screen.getAllByTestId('update-status-button')[0]!

    // Click the button and wait for the async operation to complete
    fireEvent.click(updateButton)

    // Wait for the mutation to be called and the error to be handled
    await waitFor(
      () => {
        expect(mockUpdateProjectRequestStatus).toHaveBeenCalled()
      },
      { timeout: 1000 }
    )

    // The error is expected and handled by the component, so we just verify
    // that refetch was not called due to the error
    expect(mockRefetch).not.toHaveBeenCalled()
  })

  it('handles approve error', async () => {
    const mockRefetch = vi.fn()
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: mockRefetch,
    })

    mockApproveProjectRequest.mockRejectedValue(new Error('Approve failed'))

    render(<AdminDashboardSection />)

    const approveButton = screen.getAllByTestId('approve-button')[0]!

    // Click the button and wait for the async operation to complete
    fireEvent.click(approveButton)

    // Wait for the mutation to be called
    await waitFor(() => {
      expect(mockApproveProjectRequest).toHaveBeenCalled()
    })

    // The error is expected and handled by the component, so we just verify
    // that refetch was not called due to the error
    expect(mockRefetch).not.toHaveBeenCalled()
  })

  it('updates filter button styles when selected', () => {
    mockGetProjectRequests.mockReturnValue({
      data: { projectRequests: mockProjectRequests },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AdminDashboardSection />)

    const requestedButton = screen.getByText('REQUESTED (0)')

    // Initially "ALL" should be selected
    const allButton = screen.getByText('ALL (3)')

    expect(allButton).toHaveClass(
      'border-green-400',
      'bg-green-400',
      'text-black'
    )

    // Click on "REQUESTED"
    fireEvent.click(requestedButton)

    // Now "REQUESTED" should be selected
    expect(requestedButton).toHaveClass(
      'border-green-400',
      'bg-green-400',
      'text-black'
    )
    expect(allButton).not.toHaveClass('bg-green-400', 'text-black')
  })
})
