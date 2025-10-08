import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createMockProjects } from '@/tests/mocks'

import { ProjectsPreviewSection } from './ProjectsPreviewSection'

// Mock only the specific hook we need, not the entire module
vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useGetFeaturedProjects: vi.fn(() => ({
      data: undefined,
      loading: true,
      error: undefined,
    })),
  }
})

describe('ProjectsPreviewSection', () => {
  it('renders loading state by default', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getByText('FEATURED PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('LOADING PROJECTS...')).toBeInTheDocument()
  })

  it('renders error state', async () => {
    const { useGetFeaturedProjects } = await import('@/apiClients')

    vi.mocked(useGetFeaturedProjects).mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Failed to fetch'),
    } as any)

    render(<ProjectsPreviewSection />)

    expect(screen.getByText('FEATURED PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('ERROR LOADING PROJECTS')).toBeInTheDocument()
  })

  it('renders with featured projects', async () => {
    const { ProjectsPreviewSection } = await import('./ProjectsPreviewSection')
    const { useGetFeaturedProjects } = await import('@/apiClients')

    const mockProjects = createMockProjects(1)

    vi.mocked(useGetFeaturedProjects).mockReturnValue({
      data: { featuredProjects: mockProjects },
      loading: false,
      error: undefined,
    } as any)

    render(<ProjectsPreviewSection />)

    expect(screen.getByText('FEATURED PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('INDIVIDUAL PROJECT SHOWCASE')).toBeInTheDocument()
    expect(screen.getByText('Test Project 1')).toBeInTheDocument()
  })

  it('handles empty projects array', async () => {
    const { ProjectsPreviewSection } = await import('./ProjectsPreviewSection')
    const { useGetFeaturedProjects } = await import('@/apiClients')

    vi.mocked(useGetFeaturedProjects).mockReturnValue({
      data: { featuredProjects: [] },
      loading: false,
      error: undefined,
    } as any)

    render(<ProjectsPreviewSection />)

    expect(screen.getByText('FEATURED PROJECTS')).toBeInTheDocument()
    expect(
      screen.getByText('NO FEATURED PROJECTS AVAILABLE')
    ).toBeInTheDocument()
  })

  it('renders with correct section id', async () => {
    const { ProjectsPreviewSection } = await import('./ProjectsPreviewSection')

    render(<ProjectsPreviewSection />)

    const section = document.getElementById('portfolio')

    expect(section).toBeInTheDocument()
    expect(section).toHaveAttribute('id', 'portfolio')
  })
})
