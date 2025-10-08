import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectType } from '@/graphql/generated/graphql'

import { ProjectRequestForm } from './ProjectRequestForm'

// Mock next/navigation
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

// Mock the API client
const mockCreateProjectRequest = vi.fn()
vi.mock('@/apiClients', () => ({
  useCreateProjectRequest: () => [mockCreateProjectRequest],
}))

// Mock Toast
vi.mock('@/libs/Toast', () => ({
  Toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock the validation schema
vi.mock('@/validations', () => ({
  projectRequestSchema: {
    safeParse: vi.fn(),
  },
  projectTypeOptions: [
    { value: ProjectType.Website, label: 'Website' },
    { value: ProjectType.WebApp, label: 'Web App' },
    { value: ProjectType.MobileApp, label: 'Mobile App' },
  ],
  contactPreferenceOptions: [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'text', label: 'Text Message' },
  ],
}))

describe('ProjectRequestForm', () => {
  let mockSafeParse: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { projectRequestSchema } = await import('@/validations')
    mockSafeParse = projectRequestSchema.safeParse
  })

  it('renders all form fields correctly', () => {
    render(<ProjectRequestForm />)

    // Check project details section
    expect(screen.getByText('PROJECT DETAILS')).toBeInTheDocument()
    expect(screen.getByLabelText('PROJECT NAME *')).toBeInTheDocument()
    expect(screen.getByLabelText('DESCRIPTION *')).toBeInTheDocument()
    expect(screen.getByLabelText('PROJECT TYPE *')).toBeInTheDocument()
    expect(screen.getByLabelText('BUDGET (USD)')).toBeInTheDocument()
    expect(screen.getByLabelText('TIMELINE')).toBeInTheDocument()

    // Check contact section
    expect(screen.getByText('CONTACT & ADDITIONAL INFO')).toBeInTheDocument()
    expect(
      screen.getByLabelText('PREFERRED CONTACT METHOD')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('ADDITIONAL INFORMATION')).toBeInTheDocument()

    // Check buttons
    expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'SUBMIT REQUEST' })
    ).toBeInTheDocument()
  })

  it('handles input changes correctly', () => {
    render(<ProjectRequestForm />)

    const projectNameInput = screen.getByLabelText('PROJECT NAME *')
    const descriptionInput = screen.getByLabelText('DESCRIPTION *')

    fireEvent.change(projectNameInput, { target: { value: 'Test Project' } })

    expect(projectNameInput).toHaveValue('Test Project')

    fireEvent.change(descriptionInput, {
      target: { value: 'Test description' },
    })

    expect(descriptionInput).toHaveValue('Test description')
  })

  it('handles select changes correctly', () => {
    render(<ProjectRequestForm />)

    const projectTypeSelect = screen.getByLabelText('PROJECT TYPE *')
    const contactPreferenceSelect = screen.getByLabelText(
      'PREFERRED CONTACT METHOD'
    )

    // Test project type change
    fireEvent.change(projectTypeSelect, {
      target: { value: ProjectType.WebApp },
    })

    expect(projectTypeSelect).toHaveValue(ProjectType.WebApp)

    // Test contact preference change
    fireEvent.change(contactPreferenceSelect, {
      target: { value: 'email' },
    })

    expect(contactPreferenceSelect).toHaveValue('email')
  })

  it('shows validation errors when form is submitted with invalid data', async () => {
    // Mock validation to return errors
    mockSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [
          { path: ['projectName'], message: 'Project name is required' },
          {
            path: ['description'],
            message: 'Description must be at least 20 characters',
          },
        ],
      },
    })

    render(<ProjectRequestForm />)

    const submitButton = screen.getByRole('button', { name: 'SUBMIT REQUEST' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSafeParse).toHaveBeenCalled()
    })
  })

  it('submits form successfully with valid data', async () => {
    // Mock validation to return success
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        projectName: 'Test Project',
        description: 'Test description',
        projectType: ProjectType.WebApp,
        budget: 5000,
        timeline: '2 months',
        contactPreference: 'email',
        additionalInfo: 'Test info',
      },
    })

    // Mock API call to return success
    mockCreateProjectRequest.mockResolvedValue({
      data: {
        createProjectRequest: {
          id: '1',
          projectName: 'Test Project',
        },
      },
    })

    render(<ProjectRequestForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
      target: { value: 'Test Project' },
    })
    fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
      target: { value: 'This is a test description that is long enough' },
    })
    fireEvent.change(screen.getByLabelText('BUDGET (USD)'), {
      target: { value: '5000' },
    })
    fireEvent.change(screen.getByLabelText('TIMELINE'), {
      target: { value: '2 months' },
    })

    const submitButton = screen.getByRole('button', { name: 'SUBMIT REQUEST' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSafeParse).toHaveBeenCalled()
      expect(mockCreateProjectRequest).toHaveBeenCalled()
    })

    const { Toast } = await import('@/libs/Toast')

    await waitFor(() => {
      expect(Toast.success).toHaveBeenCalledWith(
        'Project request submitted successfully!'
      )
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('handles API errors gracefully', async () => {
    // Mock validation to return success
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        projectName: 'Test Project',
        description: 'Test description',
      },
    })

    // Mock API call to return error
    mockCreateProjectRequest.mockRejectedValue(new Error('API Error'))

    render(<ProjectRequestForm />)

    // Fill out required fields
    fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
      target: { value: 'Test Project' },
    })
    fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
      target: { value: 'This is a test description that is long enough' },
    })

    const submitButton = screen.getByRole('button', { name: 'SUBMIT REQUEST' })
    fireEvent.click(submitButton)

    const { Toast } = await import('@/libs/Toast')
    await waitFor(() => {
      expect(Toast.error).toHaveBeenCalledWith('API Error')
    })
  })

  it('shows loading state during submission', async () => {
    // Mock validation to return success
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        projectName: 'Test Project',
        description: 'Test description',
      },
    })

    // Mock slow API call
    mockCreateProjectRequest.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<ProjectRequestForm />)

    // Fill out required fields
    fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
      target: { value: 'Test Project' },
    })
    fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
      target: { value: 'This is a test description that is long enough' },
    })

    const submitButton = screen.getByRole('button', { name: 'SUBMIT REQUEST' })
    fireEvent.click(submitButton)

    // Check loading state
    expect(
      screen.getByRole('button', { name: 'SUBMITTING...' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CANCEL' })).toBeDisabled()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'SUBMIT REQUEST' })
      ).toBeInTheDocument()
    })
  })

  it('handles form reset correctly', async () => {
    // Mock validation to return success
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        projectName: 'Test Project',
        description: 'Test description',
      },
    })

    // Mock slow API call
    mockCreateProjectRequest.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<ProjectRequestForm />)

    // Fill out required fields
    fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
      target: { value: 'Test Project' },
    })
    fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
      target: { value: 'This is a test description that is long enough' },
    })

    const submitButton = screen.getByRole('button', { name: 'SUBMIT REQUEST' })
    fireEvent.click(submitButton)

    // Check loading state
    expect(
      screen.getByRole('button', { name: 'SUBMITTING...' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CANCEL' })).toBeDisabled()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'SUBMIT REQUEST' })
      ).toBeInTheDocument()
    })
  })

  it('handles budget field correctly', () => {
    render(<ProjectRequestForm />)

    const budgetInput = screen.getByLabelText('BUDGET (USD)')

    // Test with budget
    fireEvent.change(budgetInput, { target: { value: '5000' } })

    expect(budgetInput).toHaveValue(5000)

    // Test without budget (empty)
    fireEvent.change(budgetInput, { target: { value: '' } })

    expect(budgetInput).toHaveValue(null)
  })

  it('handles form submission with and without budget', async () => {
    // Mock API call
    mockCreateProjectRequest.mockResolvedValue({})

    // Test with budget
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        projectName: 'Test Project',
        description: 'Test description',
        budget: 5000,
      },
    })

    render(<ProjectRequestForm />)

    // Fill out form with budget
    fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
      target: { value: 'Test Project' },
    })
    fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
      target: { value: 'This is a test description that is long enough' },
    })
    fireEvent.change(screen.getByLabelText('BUDGET (USD)'), {
      target: { value: '5000' },
    })

    const submitButton = screen.getByRole('button', { name: 'SUBMIT REQUEST' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSafeParse).toHaveBeenCalledWith(
        expect.objectContaining({
          budget: '5000',
        })
      )
    })

    // Test without budget
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        projectName: 'Test Project',
        description: 'Test description',
        budget: undefined,
      },
    })

    fireEvent.change(screen.getByLabelText('BUDGET (USD)'), {
      target: { value: '' },
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSafeParse).toHaveBeenCalledWith(
        expect.objectContaining({
          budget: '',
        })
      )
    })
  })
})
