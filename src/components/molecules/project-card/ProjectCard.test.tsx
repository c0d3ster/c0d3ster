import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ProjectDisplayFragment } from '@/graphql/generated/graphql'

import { ProjectStatus, ProjectType } from '@/graphql/generated/graphql'

import { ProjectCard } from './ProjectCard'

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock utils
vi.mock('@/utils', () => ({
  formatStatus: (status: string) => status.toUpperCase(),
  generateSlug: (name: string) => name.toLowerCase().replace(/\s+/g, '-'),
  getStatusStyling: (_status: string) => 'text-green-400',
}))

const mockProject: ProjectDisplayFragment = {
  __typename: 'Project',
  id: '1',
  title: 'Test Project',
  projectName: 'test-project',
  overview: 'A test project overview',
  description: 'A detailed test project description',
  techStack: ['React', 'TypeScript', 'Tailwind'],
  status: ProjectStatus.InProgress,
  logo: '/test-logo.png',
  featured: true,
  projectType: ProjectType.WebApp,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('ProjectCard', () => {
  it('renders project title', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('renders project overview', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('A test project overview')).toBeInTheDocument()
  })

  it('renders tech stack', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
  })

  it('renders status', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('INPROGRESS')).toBeInTheDocument()
  })

  it('renders featured star when project is featured', () => {
    const { container } = render(<ProjectCard project={mockProject} />)

    // Check for the star icon by looking for the SVG element specifically
    const svgElements = container.querySelectorAll('svg')

    expect(svgElements.length).toBeGreaterThan(0)

    // The star should be an SVG with the star path
    const starSvg = Array.from(svgElements).find((svg) =>
      svg.querySelector('path[d*="M259.3 17.8"]')
    )

    expect(starSvg).toBeInTheDocument()
  })

  it('renders decorative elements when project is not featured', () => {
    const nonFeaturedProject = { ...mockProject, featured: false }
    const { container } = render(<ProjectCard project={nonFeaturedProject} />)

    // Check that no SVG elements are present (no star icon)
    const svgElements = container.querySelectorAll('svg')

    expect(svgElements.length).toBe(0)

    // Check for decorative elements by looking for the specific div structure
    const statusElement = screen.getByText('INPROGRESS')
    const parentElement = statusElement.parentElement
    const decorativeContainer = parentElement?.querySelector(
      'div[class*="mr-1 flex space-x-1"]'
    )

    expect(decorativeContainer).toBeInTheDocument()
  })

  it('renders project logo when available', () => {
    render(<ProjectCard project={mockProject} />)

    const logo = screen.getByTestId('next-image')

    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('data-src', '/test-logo.png')
  })

  it('does not render logo when not available', () => {
    const projectWithoutLogo = { ...mockProject, logo: null }
    render(<ProjectCard project={projectWithoutLogo} />)

    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument()
  })

  it('generates correct project URL', () => {
    render(<ProjectCard project={mockProject} />)

    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('href', '/projects/test-project')
  })

  it('uses projectName as title when title is not available', () => {
    const projectWithoutTitle = { ...mockProject, title: null }
    render(<ProjectCard project={projectWithoutTitle} />)

    expect(screen.getByText('test-project')).toBeInTheDocument()
  })

  it('uses description as overview when overview is not available', () => {
    const projectWithoutOverview = { ...mockProject, overview: null }
    render(<ProjectCard project={projectWithoutOverview} />)

    expect(
      screen.getByText('A detailed test project description')
    ).toBeInTheDocument()
  })

  it('renders tech stack items correctly', () => {
    const projectWithTechStack = {
      ...mockProject,
      techStack: ['React', 'TypeScript', 'Tailwind'],
    }
    render(<ProjectCard project={projectWithTechStack} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
  })
})
