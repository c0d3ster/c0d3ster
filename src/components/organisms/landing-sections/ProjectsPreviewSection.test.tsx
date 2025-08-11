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
  ProjectCard: ({ project }: { project: any }) => (
    <div data-testid='project-card'>
      <h3>{project.projectName || project.title}</h3>
      <p>{project.overview}</p>
      <div>
        {project.tech.map((tech: string) => (
          <span key={tech}>{tech}</span>
        ))}
      </div>
      <span>{project.status}</span>
    </div>
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
    expect(screen.getByText('FEATURED PROJECTS')).toBeInTheDocument()
  })

  it('renders section header with underline', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getByText('FEATURED PROJECTS')).toBeInTheDocument()
    expect(screen.getByTestId('expanding-underline')).toBeInTheDocument()
    expect(screen.getByText('INDIVIDUAL PROJECT SHOWCASE')).toBeInTheDocument()
  })

  it('renders default featured projects', () => {
    render(<ProjectsPreviewSection />)

    expect(screen.getByText('BALLZ')).toBeInTheDocument()
    expect(screen.getByText('Kaiber.ai')).toBeInTheDocument()
    expect(screen.getByText('Fractaleyez')).toBeInTheDocument()
  })

  it('renders custom featured projects', () => {
    const customProjects = [
      {
        title: 'Custom Project Type 1',
        overview: 'Custom overview 1',
        tech: ['React', 'TypeScript'],
        status: 'COMPLETED',
        projectName: 'Custom Project 1',
      },
      {
        title: 'Custom Project Type 2',
        overview: 'Custom overview 2',
        tech: ['Vue', 'JavaScript'],
        status: 'IN PROGRESS',
        projectName: 'Custom Project 2',
      },
    ]

    render(<ProjectsPreviewSection featuredProjects={customProjects} />)

    expect(screen.getByText('Custom Project 1')).toBeInTheDocument()
    expect(screen.getByText('Custom Project 2')).toBeInTheDocument()
    expect(screen.getByText('Custom overview 1')).toBeInTheDocument()
    expect(screen.getByText('Custom overview 2')).toBeInTheDocument()
  })

  it('renders project tech stacks', () => {
    const testProjects = [
      {
        title: 'Test Project Type',
        overview: 'Test overview',
        tech: ['React', 'TypeScript', 'Tailwind'],
        status: 'COMPLETED',
        projectName: 'Test Project',
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
        title: 'Project Type 1',
        overview: 'Overview 1',
        tech: ['React'],
        status: 'COMPLETED',
        projectName: 'Project 1',
      },
    ]

    render(<ProjectsPreviewSection featuredProjects={customProjects} />)

    expect(screen.getByText('PROJECTS LOADED: 1')).toBeInTheDocument()
  })

  it('handles empty projects array', () => {
    render(<ProjectsPreviewSection featuredProjects={[]} />)

    expect(screen.getByText('FEATURED PROJECTS')).toBeInTheDocument()
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
        title: 'Simple Project Type',
        overview: 'Simple overview',
        tech: ['React'],
        status: 'COMPLETED',
        projectName: 'Simple Project',
      },
      {
        title: 'Complex Project Type',
        overview: 'Complex overview',
        tech: [
          'React',
          'Next.js',
          'TypeScript',
          'Tailwind',
          'Node.js',
          'PostgreSQL',
        ],
        status: 'IN PROGRESS',
        projectName: 'Complex Project',
      },
    ]

    render(<ProjectsPreviewSection featuredProjects={customProjects} />)

    expect(screen.getByText('Simple Project')).toBeInTheDocument()
    expect(screen.getByText('Complex Project')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
  })
})
