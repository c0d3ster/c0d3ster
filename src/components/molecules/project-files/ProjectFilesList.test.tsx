import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectFilesList } from './ProjectFilesList'

const createMockFile = (overrides = {}) => ({
  id: 'file-1',
  fileName: 'brief.pdf',
  originalFileName: 'brief.pdf',
  fileSize: 1024,
  contentType: 'application/pdf',
  caption: null,
  placement: null,
  uploadedAt: '2024-01-01T00:00:00.000Z',
  downloadUrl: null,
  ...overrides,
})

describe('ProjectFilesList', () => {
  it('renders empty state when there are no files', () => {
    render(<ProjectFilesList files={[]} />)

    expect(screen.getByText('No files uploaded yet')).toBeInTheDocument()
  })

  it('renders file name, caption, placement, and download link', () => {
    const file = createMockFile({
      caption: 'Homepage screenshot',
      placement: 'gallery',
      downloadUrl: 'https://download.example/brief.pdf',
    })

    render(<ProjectFilesList files={[file] as any} />)

    expect(screen.getByText('brief.pdf')).toBeInTheDocument()
    expect(screen.getByText('Homepage screenshot')).toBeInTheDocument()
    expect(screen.getByText('gallery')).toBeInTheDocument()
    expect(screen.getByText('Download')).toHaveAttribute(
      'href',
      'https://download.example/brief.pdf'
    )
  })

  it('renders multiple files without caption or download link', () => {
    const files = [
      createMockFile({ id: 'file-1', originalFileName: 'a.pdf' }),
      createMockFile({ id: 'file-2', originalFileName: 'b.pdf' }),
    ]

    render(<ProjectFilesList files={files as any} />)

    expect(screen.getByText('a.pdf')).toBeInTheDocument()
    expect(screen.getByText('b.pdf')).toBeInTheDocument()
    expect(screen.queryByText('Download')).not.toBeInTheDocument()
  })
})
