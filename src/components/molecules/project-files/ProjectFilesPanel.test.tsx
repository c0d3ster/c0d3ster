import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGetProjectFiles } from '@/apiClients'

import { ProjectFilesPanel } from './ProjectFilesPanel'

vi.mock('@/apiClients', () => ({
  uploadProjectFile: vi.fn(),
  useGetProjectFiles: vi.fn(),
}))

const mockUseGetProjectFiles = vi.mocked(useGetProjectFiles)

describe('ProjectFilesPanel', () => {
  it('renders loading state', () => {
    mockUseGetProjectFiles.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    } as any)

    render(<ProjectFilesPanel projectId='project-1' />)

    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseGetProjectFiles.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('failed'),
      refetch: vi.fn(),
    } as any)

    render(<ProjectFilesPanel projectId='project-1' />)

    expect(screen.getByText('Failed to load files.')).toBeInTheDocument()
  })

  it('renders the files list once loaded', () => {
    mockUseGetProjectFiles.mockReturnValue({
      data: {
        projectFiles: [
          {
            id: 'file-1',
            fileName: 'brief.pdf',
            originalFileName: 'brief.pdf',
            fileSize: 1024,
            contentType: 'application/pdf',
            caption: null,
            placement: null,
            uploadedAt: '2024-01-01T00:00:00.000Z',
            downloadUrl: null,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    } as any)

    render(<ProjectFilesPanel projectId='project-1' />)

    expect(screen.getByText('brief.pdf')).toBeInTheDocument()
  })
})
