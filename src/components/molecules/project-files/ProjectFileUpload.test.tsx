import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadProjectFile } from '@/apiClients'

import { ProjectFileUpload } from './ProjectFileUpload'

vi.mock('@/apiClients', () => ({
  uploadProjectFile: vi.fn(),
}))

describe('ProjectFileUpload', () => {
  const mockOnUploadedAction = vi.fn()
  const defaultProps = {
    projectId: 'test-project-123',
    onUploadedAction: mockOnUploadedAction,
  }

  const selectFile = (file = new File(['content'], 'brief.pdf', { type: 'application/pdf' })) => {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    return file
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders only the file input until a file is chosen', () => {
    render(<ProjectFileUpload {...defaultProps} />)

    expect(document.querySelector('input[type="file"]')).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Caption (optional)')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Upload' })
    ).not.toBeInTheDocument()
  })

  it('shows the caption field and an upload button after selecting a file, without uploading yet', () => {
    render(<ProjectFileUpload {...defaultProps} />)

    selectFile()

    expect(screen.getByText('brief.pdf')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Caption (optional)')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    expect(uploadProjectFile).not.toHaveBeenCalled()
  })

  it('uploads with the caption and placement only once the upload button is clicked', async () => {
    vi.mocked(uploadProjectFile).mockResolvedValue({} as any)

    render(<ProjectFileUpload {...defaultProps} />)

    const mockFile = selectFile()

    fireEvent.change(screen.getByPlaceholderText('Caption (optional)'), {
      target: { value: 'Project brief' },
    })

    expect(uploadProjectFile).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => {
      expect(uploadProjectFile).toHaveBeenCalledWith(
        'test-project-123',
        mockFile,
        expect.objectContaining({ caption: 'Project brief' })
      )
    })

    await waitFor(() => {
      expect(
        screen.getByText('File uploaded successfully!')
      ).toBeInTheDocument()
    })

    expect(mockOnUploadedAction).toHaveBeenCalled()
    expect(
      screen.queryByPlaceholderText('Caption (optional)')
    ).not.toBeInTheDocument()
  })

  it('shows an error when the upload fails', async () => {
    vi.mocked(uploadProjectFile).mockRejectedValue(new Error('Upload failed'))

    render(<ProjectFileUpload {...defaultProps} />)

    selectFile()
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => {
      expect(screen.getByText('Error: Upload failed')).toBeInTheDocument()
    })

    expect(mockOnUploadedAction).not.toHaveBeenCalled()
  })

  it('lets the user pick a different file before uploading', () => {
    render(<ProjectFileUpload {...defaultProps} />)

    selectFile(new File(['a'], 'first.pdf', { type: 'application/pdf' }))

    expect(screen.getByText('first.pdf')).toBeInTheDocument()

    selectFile(new File(['b'], 'second.pdf', { type: 'application/pdf' }))

    expect(screen.getByText('second.pdf')).toBeInTheDocument()
    expect(screen.queryByText('first.pdf')).not.toBeInTheDocument()
    expect(uploadProjectFile).not.toHaveBeenCalled()
  })

  it('does nothing when no file is selected', () => {
    render(<ProjectFileUpload {...defaultProps} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(uploadProjectFile).not.toHaveBeenCalled()
    expect(
      screen.queryByPlaceholderText('Caption (optional)')
    ).not.toBeInTheDocument()
  })
})
