import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadProjectLogo } from '@/apiClients'

import { LogoUpload } from './LogoUpload'

vi.mock('@/apiClients', () => ({
  uploadProjectLogo: vi.fn(),
}))

describe('LogoUpload', () => {
  const mockOnLogoUploadedAction = vi.fn()
  const defaultProps = {
    projectId: 'test-project-123',
    onLogoUploadedAction: mockOnLogoUploadedAction,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with default props', () => {
    render(<LogoUpload {...defaultProps} />)

    expect(screen.getByText('UPLOAD PROJECT LOGO')).toBeInTheDocument()
    expect(
      screen.getByText('Add a custom logo for your project')
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /cancel/i })
    ).not.toBeInTheDocument()
  })

  it('renders with showCancel prop', () => {
    render(<LogoUpload {...defaultProps} showCancel={true} />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('handles file selection with valid image file', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    vi.mocked(uploadProjectLogo).mockResolvedValue('https://example.com/logo.png')

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Uploading logo...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(uploadProjectLogo).toHaveBeenCalledWith(
        'test-project-123',
        mockFile
      )
    })

    await waitFor(() => {
      expect(
        screen.getByText('Logo uploaded successfully!')
      ).toBeInTheDocument()
    })

    expect(mockOnLogoUploadedAction).toHaveBeenCalledWith(
      'https://example.com/logo.png'
    )
  })

  it('handles file selection with invalid file type', () => {
    const mockFile = new File(['fake-content'], 'test.txt', {
      type: 'text/plain',
    })

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    expect(
      screen.getByText('Please select an image file (PNG, JPG, etc.)')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(uploadProjectLogo).not.toHaveBeenCalled()
  })

  it('handles file selection with no file', () => {
    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(screen.queryByText('Uploading logo...')).not.toBeInTheDocument()
    expect(uploadProjectLogo).not.toHaveBeenCalled()
  })

  it('handles upload API error', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    vi.mocked(uploadProjectLogo).mockRejectedValue(new Error('Upload failed'))

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Error: Upload failed')).toBeInTheDocument()
    })

    expect(mockOnLogoUploadedAction).not.toHaveBeenCalled()
  })

  it('handles upload API response without download URL', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    vi.mocked(uploadProjectLogo).mockResolvedValue(undefined)

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(
        screen.getByText('Error: Upload failed - no data returned')
      ).toBeInTheDocument()
    })

    expect(mockOnLogoUploadedAction).not.toHaveBeenCalled()
  })

  it('handles cancel button click', () => {
    render(<LogoUpload {...defaultProps} showCancel={true} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnLogoUploadedAction).toHaveBeenCalledWith('')
  })

  it('shows cancel button after file selection', () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    vi.mocked(uploadProjectLogo).mockResolvedValue('https://example.com/x.png')

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('disables cancel button during upload', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    vi.mocked(uploadProjectLogo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('https://x'), 100))
    )

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('shows error status in red color', () => {
    const mockFile = new File(['fake-image-content'], 'test.txt', {
      type: 'text/plain',
    })

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    const errorMessage = screen.getByText(
      'Please select an image file (PNG, JPG, etc.)'
    )

    expect(errorMessage).toHaveClass('text-red-400')
  })

  it('shows success status in green color', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    vi.mocked(uploadProjectLogo).mockResolvedValue('https://example.com/logo.png')

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      const successMessage = screen.getByText('Logo uploaded successfully!')

      expect(successMessage).toHaveClass('text-green-400')
    })
  })

  it('handles unknown error type', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    vi.mocked(uploadProjectLogo).mockRejectedValue('Unknown error')

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Error: Unknown error')).toBeInTheDocument()
    })
  })
})
