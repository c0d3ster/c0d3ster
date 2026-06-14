import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetProjectRequestById } from '@/apiClients/projectRequestApiClient'
import { ProjectStatus, ProjectType } from '@/graphql/generated/graphql'
import { createMockProjectRequest } from '@/tests/mocks'

import { ProjectRequestDetail } from './ProjectRequestDetail'

vi.mock('@/apiClients/projectRequestApiClient', () => ({
  useGetProjectRequestById: vi.fn(),
}))

vi.mock('./RequirementsList', () => ({
  RequirementsList: () => <div data-testid='requirements-list' />,
}))

const mockUseGetProjectRequestById = vi.mocked(useGetProjectRequestById)

const mockRequest = createMockProjectRequest({
  id: '1',
  title: 'My Website',
  projectName: 'my-website',
  description: 'A personal portfolio site',
  projectType: ProjectType.WebApp,
  budget: 2500,
  timeline: '6 weeks',
  additionalInfo: 'Prefer dark theme',
  status: ProjectStatus.InReview,
  requirements: { __typename: 'ProjectRequirements', hasDesign: true },
  statusUpdates: [
    {
      __typename: 'StatusUpdate',
      id: 'su-1',
      newStatus: ProjectStatus.InReview,
      updateMessage: 'We are reviewing your request',
      createdAt: '2024-02-01T00:00:00Z',
    },
  ],
})

describe('ProjectRequestDetail', () => {
  it('renders loading state', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders error state with back link when request not found', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Not found'),
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText(/request not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    )
  })

  it('renders error state when data is missing', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: null },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText(/request not found/i)).toBeInTheDocument()
  })

  it('renders project request title and type', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: mockRequest },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText('My Website')).toBeInTheDocument()
    expect(screen.getByText('WebApp')).toBeInTheDocument()
  })

  it('renders budget and timeline', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: mockRequest },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText('$2,500')).toBeInTheDocument()
    expect(screen.getByText('6 weeks')).toBeInTheDocument()
  })

  it('renders description', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: mockRequest },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText('A personal portfolio site')).toBeInTheDocument()
  })

  it('renders requirements section when requirements exist', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: mockRequest },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByTestId('requirements-list')).toBeInTheDocument()
  })

  it('renders additional info when present', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: mockRequest },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText('Prefer dark theme')).toBeInTheDocument()
  })

  it('renders status updates', () => {
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: mockRequest },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(
      screen.getByText('We are reviewing your request')
    ).toBeInTheDocument()
  })

  it('omits additional info section when not present', () => {
    const requestWithoutInfo = createMockProjectRequest({
      ...mockRequest,
      additionalInfo: null,
    })
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: requestWithoutInfo },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.queryByText('Additional Info')).not.toBeInTheDocument()
  })

  it('omits status updates section when empty', () => {
    const requestWithoutUpdates = createMockProjectRequest({
      ...mockRequest,
      statusUpdates: [],
    })
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: requestWithoutUpdates },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.queryByText('Updates')).not.toBeInTheDocument()
  })

  it('falls back to projectName when title is absent', () => {
    const requestWithoutTitle = createMockProjectRequest({
      ...mockRequest,
      title: undefined,
      projectName: 'my-website',
    })
    mockUseGetProjectRequestById.mockReturnValue({
      data: { projectRequest: requestWithoutTitle },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useGetProjectRequestById>)

    render(<ProjectRequestDetail id='1' />)

    expect(screen.getByText('my-website')).toBeInTheDocument()
  })
})
