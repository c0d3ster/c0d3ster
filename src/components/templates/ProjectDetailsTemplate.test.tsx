import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectStatus } from '@/graphql/generated/graphql'
import { createMockFullProject } from '@/tests/mocks'

import { ProjectDetailsTemplate } from './ProjectDetailsTemplate'

// Mock only the API clients that ProjectDetailsTemplate actually uses
const mockGetMe = vi.fn()
const mockGetFile = vi.fn()

// Mock the specific functions we need, let the rest use real implementations
vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useGetMe: () => mockGetMe(),
    useGetFile: () => mockGetFile(),
  }
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  __esModule: true,
  default: {},

  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Use global mocks from test setup

const mockProject = createMockFullProject({
  status: ProjectStatus.Completed,
  projectName: 'TestProject',
  description: 'This is a detailed description of the test project.',
  featured: true,
  progressPercentage: 100,
  actualCompletionDate: '2024-02-28',
  client: {
    id: 'client1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  developer: {
    id: 'dev1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  },
})

describe('ProjectDetailsTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock behavior
    mockGetMe.mockReturnValue({
      data: { me: null },
      loading: false,
    })
    mockGetFile.mockReturnValue({
      data: null,
      loading: false,
    })
  })

  it('renders project header with correct information', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    expect(screen.getByText('TestProject')).toBeInTheDocument()
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('A test project overview')).toBeInTheDocument()
  })

  it('renders project header with projectName when title is not available', () => {
    const projectWithoutTitle = { ...mockProject, title: undefined }
    render(<ProjectDetailsTemplate project={projectWithoutTitle} />)

    // Check that projectName appears in the h1 heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'TestProject'
    )
    // Check that projectName appears in the subtitle paragraph (there are 2 elements with this text)
    expect(screen.getAllByText('TestProject')).toHaveLength(2)
    expect(screen.getByText('A test project overview')).toBeInTheDocument()
  })

  it('renders project logo when available', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    const logo = screen.getByTestId('next-image')

    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('data-src', '/test-logo.png')
  })

  it('renders status badge with correct styling', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    const statusBadge = screen.getByText('COMPLETED')

    expect(statusBadge).toBeInTheDocument()
    expect(statusBadge).toHaveClass(
      'border-green-400/40',
      'bg-green-400/20',
      'text-green-400'
    )
  })

  it('renders technologies used section', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    expect(screen.getByText('TECHNOLOGIES USED')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
  })

  it('renders project details section', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    expect(screen.getByText('PROJECT DETAILS')).toBeInTheDocument()
    expect(
      screen.getByText('This is a detailed description of the test project.')
    ).toBeInTheDocument()
  })

  it('renders access project button when liveUrl is available', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    const accessButton = screen.getByRole('link', { name: 'ACCESS PROJECT' })

    expect(accessButton).toBeInTheDocument()
    expect(accessButton).toHaveAttribute('href', 'https://testproject.com')
    expect(accessButton).toHaveAttribute('target', '_blank')
    expect(accessButton).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not render access project button when liveUrl is not available', () => {
    const projectWithoutUrl = { ...mockProject, liveUrl: undefined }
    render(<ProjectDetailsTemplate project={projectWithoutUrl} />)

    expect(
      screen.queryByRole('link', { name: 'ACCESS PROJECT' })
    ).not.toBeInTheDocument()
  })

  it('renders back button with correct link', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    const backButton = screen.getByRole('link', { name: 'BACK' })

    expect(backButton).toBeInTheDocument()
    expect(backButton).toHaveAttribute('href', '#')
  })

  it('renders project without logo gracefully', () => {
    const projectWithoutLogo = { ...mockProject, logo: undefined }
    render(<ProjectDetailsTemplate project={projectWithoutLogo} />)

    expect(screen.queryByAltText('Test Project logo')).not.toBeInTheDocument()
  })

  it('renders project without description with fallback text', () => {
    const projectWithoutDescription = { ...mockProject, description: '' }
    render(<ProjectDetailsTemplate project={projectWithoutDescription} />)

    expect(
      screen.getByText('Project details coming soon...')
    ).toBeInTheDocument()
  })

  it('renders in-progress status with correct styling', () => {
    const inProgressProject = {
      ...mockProject,
      status: ProjectStatus.InProgress,
    }
    render(<ProjectDetailsTemplate project={inProgressProject} />)

    const statusBadge = screen.getByText('IN PROGRESS')

    expect(statusBadge).toHaveClass(
      'border-yellow-400/40',
      'bg-yellow-400/20',
      'text-yellow-400'
    )
  })
})
