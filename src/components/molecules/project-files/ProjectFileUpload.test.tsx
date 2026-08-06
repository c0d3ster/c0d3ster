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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<ProjectFileUpload {...defaultProps} />)

    expect(screen.getByText('UPLOAD FILE')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Caption (optional)')
    ).toBeInTheDocument()
  })

  it('uploads the selected file with caption and placement', async () => {
    const mockFile = new File(['content'], 'brief.pdf', {
      type: 'application/pdf',
    })

    vi.mocked(uploadProjectFile).mockResolvedValue({} as any)

    render(<ProjectFileUpload {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText('Caption (optional)'), {
      target: { value: 'Project brief' },
    })

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

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
  })

  it('shows an error when the upload fails', async () => {
    const mockFile = new File(['content'], 'brief.pdf', {
      type: 'application/pdf',
    })

    vi.mocked(uploadProjectFile).mockRejectedValue(new Error('Upload failed'))

    render(<ProjectFileUpload {...defaultProps} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Error: Upload failed')).toBeInTheDocument()
    })

    expect(mockOnUploadedAction).not.toHaveBeenCalled()
  })

  it('does nothing when no file is selected', () => {
    render(<ProjectFileUpload {...defaultProps} />)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(uploadProjectFile).not.toHaveBeenCalled()
  })
})
