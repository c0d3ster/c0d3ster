import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LogoUpload } from './LogoUpload'

// Mock the API client
const mockUploadLogo = vi.fn()
vi.mock('@/apiClients', () => ({
  useUploadProjectLogo: () => [mockUploadLogo],
}))

// Mock FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  onload: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  result: null as string | null,
}

// Mock global FileReader
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
})

describe('LogoUpload', () => {
  const mockOnLogoUploadedAction = vi.fn()
  const defaultProps = {
    projectId: 'test-project-123',
    onLogoUploadedAction: mockOnLogoUploadedAction,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFileReader.onload = null
    mockFileReader.onerror = null
    mockFileReader.result = null
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
    const mockBase64 = 'data:image/png;base64,fake-base64-data'
    const mockBase64Data = 'fake-base64-data'

    // Mock FileReader behavior
    mockFileReader.result = mockBase64
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockBase64 } })
        }
      }, 0)
    })

    // Mock successful upload
    mockUploadLogo.mockResolvedValue({
      data: {
        uploadProjectLogo: 'https://example.com/logo.png',
      },
    })

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Converting file...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(mockUploadLogo).toHaveBeenCalledWith({
        variables: {
          projectId: 'test-project-123',
          file: mockBase64Data,
          fileName: 'test.png',
          contentType: 'image/png',
        },
      })
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
    expect(mockUploadLogo).not.toHaveBeenCalled()
  })

  it('handles file selection with no file', () => {
    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(screen.queryByText('Converting file...')).not.toBeInTheDocument()
    expect(mockUploadLogo).not.toHaveBeenCalled()
  })

  it('handles FileReader error during file conversion', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    // Mock FileReader error
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror(new Error('File read error'))
        }
      }, 0)
    })

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText(/Error: File read error/)).toBeInTheDocument()
    })

    expect(mockUploadLogo).not.toHaveBeenCalled()
  })

  it('handles FileReader result that is not a string', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    // Mock FileReader with non-string result
    mockFileReader.result = null
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: null } })
        }
      }, 0)
    })

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to read file/)).toBeInTheDocument()
    })

    expect(mockUploadLogo).not.toHaveBeenCalled()
  })

  it('handles FileReader result without base64 data', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })

    // Mock FileReader with result that doesn't contain base64 data
    mockFileReader.result = 'data:image/png;base64,'
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({
            target: { result: 'data:image/png;base64,' },
          })
        }
      }, 0)
    })

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(
        screen.getByText(/Error: Failed to extract base64 data/)
      ).toBeInTheDocument()
    })

    expect(mockUploadLogo).not.toHaveBeenCalled()
  })

  it('handles upload API error', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })
    const mockBase64 = 'data:image/png;base64,fake-base64-data'

    // Mock FileReader behavior
    mockFileReader.result = mockBase64
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockBase64 } })
        }
      }, 0)
    })

    // Mock API error
    mockUploadLogo.mockRejectedValue(new Error('Upload failed'))

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Error: Upload failed')).toBeInTheDocument()
    })

    expect(mockOnLogoUploadedAction).not.toHaveBeenCalled()
  })

  it('handles upload API response without data', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })
    const mockBase64 = 'data:image/png;base64,fake-base64-data'

    // Mock FileReader behavior
    mockFileReader.result = mockBase64
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockBase64 } })
        }
      }, 0)
    })

    // Mock API response without data
    mockUploadLogo.mockResolvedValue({
      data: null,
    })

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

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('disables cancel button during upload', async () => {
    const mockFile = new File(['fake-image-content'], 'test.png', {
      type: 'image/png',
    })
    const mockBase64 = 'data:image/png;base64,fake-base64-data'

    // Mock FileReader behavior
    mockFileReader.result = mockBase64
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockBase64 } })
        }
      }, 0)
    })

    // Mock slow upload
    mockUploadLogo.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Wait for cancel button to appear
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument()
    })

    // Check that cancel button is disabled during upload
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('shows error status in red color', async () => {
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
    const mockBase64 = 'data:image/png;base64,fake-base64-data'

    // Mock FileReader behavior
    mockFileReader.result = mockBase64
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockBase64 } })
        }
      }, 0)
    })

    // Mock successful upload
    mockUploadLogo.mockResolvedValue({
      data: {
        uploadProjectLogo: 'https://example.com/logo.png',
      },
    })

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
    const mockBase64 = 'data:image/png;base64,fake-base64-data'

    // Mock FileReader behavior
    mockFileReader.result = mockBase64
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockBase64 } })
        }
      }, 0)
    })

    // Mock API error with non-Error object
    mockUploadLogo.mockRejectedValue('Unknown error')

    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByDisplayValue('')
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    await waitFor(() => {
      expect(screen.getByText('Error: Unknown error')).toBeInTheDocument()
    })
  })
})
