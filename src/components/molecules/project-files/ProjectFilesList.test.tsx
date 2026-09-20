import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
  it('shows only the add tile when there are no files', () => {
    const onAddClick = vi.fn()
    render(<ProjectFilesList files={[]} onAddClick={onAddClick} />)

    const addButton = screen.getByRole('button', { name: 'Upload file' })

    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)

    expect(onAddClick).toHaveBeenCalled()
  })

  it('renders a thumbnail button per file plus an add tile', () => {
    const files = [
      createMockFile({ id: 'file-1', originalFileName: 'a.pdf' }),
      createMockFile({ id: 'file-2', originalFileName: 'b.pdf' }),
    ]

    render(<ProjectFilesList files={files as any} onAddClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'a.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'b.pdf' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Upload file' })
    ).toBeInTheDocument()
  })

  it('wraps into additional rows past 3 files instead of hiding them', () => {
    const files = [
      createMockFile({ id: 'file-1', originalFileName: 'a.pdf' }),
      createMockFile({ id: 'file-2', originalFileName: 'b.pdf' }),
      createMockFile({ id: 'file-3', originalFileName: 'c.pdf' }),
      createMockFile({ id: 'file-4', originalFileName: 'd.pdf' }),
    ]

    render(<ProjectFilesList files={files as any} onAddClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'a.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'b.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'c.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'd.pdf' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Upload file' })
    ).toBeInTheDocument()
  })

  it('hides the add tile once the soft cap is reached', () => {
    const files = Array.from({ length: 9 }, (_, index) =>
      createMockFile({
        id: `file-${index}`,
        originalFileName: `${index}.pdf`,
      })    )

    render(<ProjectFilesList files={files as any} onAddClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: '0.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '8.pdf' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Upload file' })
    ).not.toBeInTheDocument()
  })

  it('renders an image thumbnail for image files', () => {
    const file = createMockFile({
      contentType: 'image/png',
      downloadUrl: 'https://download.example/photo.png',
    })

    render(<ProjectFilesList files={[file] as any} onAddClick={vi.fn()} />)

    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      'https://download.example/photo.png'
    )
  })

  it('opens a full-view modal with the image when a thumbnail is clicked', () => {
    const file = createMockFile({
      contentType: 'image/png',
      caption: 'Homepage screenshot',
      downloadUrl: 'https://download.example/photo.png',
    })

    render(<ProjectFilesList files={[file] as any} onAddClick={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Homepage screenshot' })
    )

    expect(screen.getByText('Homepage screenshot')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('shows an open-file link in the modal for non-image files', () => {
    const file = createMockFile({
      downloadUrl: 'https://download.example/brief.pdf',
    })

    render(<ProjectFilesList files={[file] as any} onAddClick={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'brief.pdf' }))

    expect(screen.getByText('Open file')).toHaveAttribute(
      'href',
      'https://download.example/brief.pdf'
    )
  })

  it('closes the modal when the close button is clicked', () => {
    const file = createMockFile()

    render(<ProjectFilesList files={[file] as any} onAddClick={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'brief.pdf' }))

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument()
  })
})
