import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectDetailsTemplate } from './ProjectDetailsTemplate'

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, priority, ...props }: any) => (
    <div data-testid='next-image' data-src={src} data-alt={alt} {...props} />
  ),
}))

// Mock the Project type
const mockProject = {
  title: 'Test Project',
  overview: 'A test project for testing purposes',
  tech: ['React', 'TypeScript', 'Tailwind'],
  status: 'COMPLETED',
  logo: '/test-logo.png',
  projectName: 'TestProject',
  projectUrl: 'https://testproject.com',
  description: 'This is a detailed description of the test project.',
}

describe('ProjectDetailsTemplate', () => {
  it('renders project header with correct information', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    expect(screen.getByText('TestProject')).toBeInTheDocument()
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(
      screen.getByText('A test project for testing purposes')
    ).toBeInTheDocument()
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

  it('renders access project button when projectUrl is available', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    const accessButton = screen.getByRole('link', { name: 'ACCESS PROJECT' })

    expect(accessButton).toBeInTheDocument()
    expect(accessButton).toHaveAttribute('href', 'https://testproject.com')
    expect(accessButton).toHaveAttribute('target', '_blank')
    expect(accessButton).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not render access project button when projectUrl is not available', () => {
    const projectWithoutUrl = { ...mockProject, projectUrl: undefined }
    render(<ProjectDetailsTemplate project={projectWithoutUrl} />)

    expect(
      screen.queryByRole('link', { name: 'ACCESS PROJECT' })
    ).not.toBeInTheDocument()
  })

  it('renders back button with correct link', () => {
    render(<ProjectDetailsTemplate project={mockProject} />)

    const backButton = screen.getByRole('link', { name: 'BACK TO PROJECTS' })

    expect(backButton).toBeInTheDocument()
    expect(backButton).toHaveAttribute('href', '/projects')
  })

  it('renders project without logo gracefully', () => {
    const projectWithoutLogo = { ...mockProject, logo: undefined }
    render(<ProjectDetailsTemplate project={projectWithoutLogo} />)

    expect(screen.queryByAltText('Test Project logo')).not.toBeInTheDocument()
  })

  it('renders project without description with fallback text', () => {
    const projectWithoutDescription = { ...mockProject, description: undefined }
    render(<ProjectDetailsTemplate project={projectWithoutDescription} />)

    expect(
      screen.getByText('Project details coming soon...')
    ).toBeInTheDocument()
  })

  it('renders in-progress status with correct styling', () => {
    const inProgressProject = { ...mockProject, status: 'IN PROGRESS' }
    render(<ProjectDetailsTemplate project={inProgressProject} />)

    const statusBadge = screen.getByText('IN PROGRESS')

    expect(statusBadge).toHaveClass(
      'border-yellow-400/40',
      'bg-yellow-400/20',
      'text-yellow-400'
    )
  })
})
