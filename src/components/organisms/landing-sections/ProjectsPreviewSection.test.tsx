import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectsPreviewSection } from './ProjectsPreviewSection'

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock child components
vi.mock('@/components/atoms', () => ({
  __esModule: true,
  ExpandingUnderline: () => <div data-testid='expanding-underline' />,
  ScrollFade: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='scroll-fade'>{children}</div>
  ),
  SectionWrapper: ({
    children,
    id,
  }: {
    children: React.ReactNode
    id: string
  }) => (
    <section id={id} data-testid='section-wrapper'>
      {children}
    </section>
  ),
  TypewriterEffect: ({ text }: { text: string }) => (
    <span data-testid='typewriter'>{text}</span>
  ),
}))

vi.mock('@/components/molecules', () => ({
  __esModule: true,
  AnimatedHeading: ({ text }: { text: string }) => (
    <h2 data-testid='animated-heading'>{text}</h2>
  ),
}))

describe('ProjectsPreviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with default projects', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getByTestId('section-wrapper')).toBeInTheDocument()
    expect(screen.getByText('PORTFOLIO')).toBeInTheDocument()
  })

  it('renders section header with underline', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getByText('PORTFOLIO')).toBeInTheDocument()
    expect(screen.getByTestId('expanding-underline')).toBeInTheDocument()
    expect(screen.getByText('HIGHLIGHTED PROJECT SHOWCASE')).toBeInTheDocument()
  })

  it('renders default featured projects', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument()
    expect(screen.getByText('Real-time Dashboard')).toBeInTheDocument()
    expect(screen.getByText('API Gateway')).toBeInTheDocument()
  })

  it('renders custom featured projects', () => {
    const customProjects = [
      {
        title: 'Custom Project 1',
        description: 'Custom description 1',
        tech: ['React', 'TypeScript'],
        status: 'COMPLETED',
      },
      {
        title: 'Custom Project 2',
        description: 'Custom description 2',
        tech: ['Vue', 'JavaScript'],
        status: 'IN PROGRESS',
      },
    ]

    render(<ProjectsPreviewSection featuredProjects={customProjects} />)

    expect(screen.getByText('Custom Project 1')).toBeInTheDocument()
    expect(screen.getByText('Custom Project 2')).toBeInTheDocument()
    expect(screen.getByText('Custom description 1')).toBeInTheDocument()
    expect(screen.getByText('Custom description 2')).toBeInTheDocument()
  })

  it('renders project tech stacks', () => {
    const testProjects = [
      {
        title: 'Test Project',
        description: 'Test description',
        tech: ['React', 'TypeScript', 'Tailwind'],
        status: 'COMPLETED',
      },
    ]

    render(<ProjectsPreviewSection featuredProjects={testProjects} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Tailwind')).toBeInTheDocument()
  })

  it('renders project statuses', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getAllByText('COMPLETED')).toHaveLength(2)
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
  })

  it('renders view all projects link', () => {
    render(<ProjectsPreviewSection />)

    const viewAllLink = screen.getByText('VIEW ALL PROJECTS').closest('a')

    expect(viewAllLink).toBeInTheDocument()
    expect(viewAllLink).toHaveAttribute('href', '/projects')
  })

  it('renders statistics with typewriter effects', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getByText('PROJECTS LOADED: 3')).toBeInTheDocument()
    expect(screen.getByText('SUCCESS RATE: 100%')).toBeInTheDocument()
    expect(
      screen.getByText('CLIENT SATISFACTION: EXCELLENT')
    ).toBeInTheDocument()
  })

  it('updates project count in statistics based on props', () => {
    const customProjects = [
      {
        title: 'Project 1',
        description: 'Description 1',
        tech: ['React'],
        status: 'COMPLETED',
      },
    ]

    render(<ProjectsPreviewSection featuredProjects={customProjects} />)

    expect(screen.getByText('PROJECTS LOADED: 1')).toBeInTheDocument()
  })

  it('handles empty projects array', () => {
    render(<ProjectsPreviewSection featuredProjects={[]} />)

    expect(screen.getByText('PORTFOLIO')).toBeInTheDocument()
    expect(screen.getByText('PROJECTS LOADED: 0')).toBeInTheDocument()
  })

  it('renders with correct section id', () => {
    render(<ProjectsPreviewSection />)

    const section = screen.getByTestId('section-wrapper')

    expect(section).toHaveAttribute('id', 'portfolio')
  })

  it('wraps content in ScrollFade components', () => {
    render(<ProjectsPreviewSection />)

    const scrollFadeElements = screen.getAllByTestId('scroll-fade')

    expect(scrollFadeElements.length).toBeGreaterThan(0)
  })

  it('handles projects with different tech stack lengths', () => {
    const customProjects = [
      {
        title: 'Simple Project',
        description: 'Simple description',
        tech: ['React'],
        status: 'COMPLETED',
      },
      {
        title: 'Complex Project',
        description: 'Complex description',
        tech: [
          'React',
          'Next.js',
          'TypeScript',
          'Tailwind',
          'Node.js',
          'PostgreSQL',
        ],
        status: 'IN PROGRESS',
      },
    ]

    render(<ProjectsPreviewSection featuredProjects={customProjects} />)

    expect(screen.getByText('Simple Project')).toBeInTheDocument()
    expect(screen.getByText('Complex Project')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
  })
})
