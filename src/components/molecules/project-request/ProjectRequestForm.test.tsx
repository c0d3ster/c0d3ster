import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ProjectFeature, ProjectType } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'
import { getDefaultFeaturesForProjectType } from '@/validations'

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
const mockInferProjectDetails = vi.fn()
vi.mock('@/apiClients', () => ({
  useCreateProjectRequest: () => [mockCreateProjectRequest],
  useInferProjectDetails: () => [mockInferProjectDetails, { loading: false }],
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

// Mock the validation module
vi.mock('@/validations', () => {
  const mockRequestSchema = z.object({
    projectName: z.string().trim().min(1, 'Project name is required'),
    title: z.string().optional(),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters'),
    projectType: z.nativeEnum(ProjectType),
    budget: z
      .string()
      .optional()
      .refine((val) => !val || Number(val) >= 0, {
        message: 'Budget must be a non-negative number',
      }),
    timeline: z.string().max(100, 'Timeline too long').optional(),
    contactPreference: z.enum(['email', 'phone', 'text']).optional(),
    additionalInfo: z.string().optional(),
    features: z.array(z.nativeEnum(ProjectFeature)).optional(),
  })

  return {
  projectRequestSchema: mockRequestSchema,
  projectDescriptionSchema: mockRequestSchema.pick({
    projectName: true,
    description: true,
  }),
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
  projectFeatureOptions: [
    { value: ProjectFeature.Database, label: 'Database' },
    { value: ProjectFeature.Auth, label: 'Auth' },
    { value: ProjectFeature.PaymentProcessing, label: 'Payment processing' },
  ],
  projectFeatureGroups: [
    {
      label: 'Core Build',
      features: [ProjectFeature.Database, ProjectFeature.Auth],
    },
    {
      label: 'Commerce',
      features: [ProjectFeature.PaymentProcessing],
    },
  ],
  projectTypeDescriptions: {
    [ProjectType.Website]: 'A simple informational site.',
    [ProjectType.WebApp]: 'A fully functional application.',
    [ProjectType.MobileApp]: 'A native or cross-platform app.',
  },
  getDefaultFeaturesForProjectType: vi.fn(() => []),
  }
})

const LONG_DESCRIPTION = 'An online store selling handmade goods to customers'

const suggestion = {
  data: {
    inferProjectDetails: {
      projectType: ProjectType.WebApp,
      features: [ProjectFeature.Auth, ProjectFeature.Database],
      title: 'Handmade Goods Store',
    },
  },
}

// Fills step 1 and clicks Next
const completeStepOne = (
  projectName = 'My Store',
  description = LONG_DESCRIPTION
) => {
  fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
    target: { value: projectName },
  })
  fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
    target: { value: description },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'REVIEW YOUR REQUEST' })
  )
}

const goToReview = async () => {
  completeStepOne()
  await screen.findByLabelText('TITLE')
}

describe('ProjectRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom does not implement scrollIntoView, which runs when a field has an error
    Element.prototype.scrollIntoView = vi.fn()
    vi.mocked(getDefaultFeaturesForProjectType).mockReturnValue([])
    mockInferProjectDetails.mockResolvedValue(suggestion)
  })

  describe('step 1: describe', () => {
    it('shows only the name and description with a next button', () => {
      render(<ProjectRequestForm />)

      expect(screen.getByText('STEP 1 OF 2: DESCRIBE')).toBeInTheDocument()
      expect(screen.getByLabelText('PROJECT NAME *')).toBeInTheDocument()
      expect(screen.getByLabelText('DESCRIPTION *')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'REVIEW YOUR REQUEST' })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument()

      expect(screen.queryByLabelText('TITLE')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('PROJECT TYPE *')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('BUDGET (USD)')).not.toBeInTheDocument()
    })

    it('handles input changes', () => {
      render(<ProjectRequestForm />)

      fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
        target: { value: 'Test Project' },
      })
      fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
        target: { value: 'Test description' },
      })

      expect(screen.getByLabelText('PROJECT NAME *')).toHaveValue(
        'Test Project'
      )
      expect(screen.getByLabelText('DESCRIPTION *')).toHaveValue(
        'Test description'
      )
    })

    it('goes back when cancelled', () => {
      render(<ProjectRequestForm />)

      fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }))

      expect(mockBack).toHaveBeenCalled()
    })

    it('shows validation errors and stays on step 1 without calling the model', async () => {
      render(<ProjectRequestForm />)

      fireEvent.click(
        screen.getByRole('button', { name: 'REVIEW YOUR REQUEST' })
      )

      expect(
        await screen.findByText('Project name is required')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Description must be at least 20 characters')
      ).toBeInTheDocument()
      expect(mockInferProjectDetails).not.toHaveBeenCalled()
      expect(screen.queryByLabelText('TITLE')).not.toBeInTheDocument()
    })
  })

  describe('moving to step 2', () => {
    it('sends the name and description to the model and prefills type, title, and features', async () => {
      render(<ProjectRequestForm />)

      await goToReview()

      expect(mockInferProjectDetails).toHaveBeenCalledWith({
        variables: {
          input: { projectName: 'My Store', description: LONG_DESCRIPTION },
        },
      })
      expect(screen.getByText('STEP 2 OF 2: REVIEW')).toBeInTheDocument()
      expect(screen.getByLabelText('TITLE')).toHaveValue('Handmade Goods Store')
      expect(screen.getByLabelText('PROJECT TYPE *')).toHaveValue(
        ProjectType.WebApp
      )
      expect(screen.getByText(/We filled in a title/)).toBeInTheDocument()
    })

    it('fills in the suggested features as selected instead of listing them', async () => {
      render(<ProjectRequestForm />)

      await goToReview()

      expect(screen.getByText(/▸ FEATURES SELECTED \(2\)/)).toBeInTheDocument()

      fireEvent.click(screen.getByText(/▸ FEATURES SELECTED/))

      expect(screen.getByLabelText('Auth')).toBeChecked()
      expect(screen.getByLabelText('Database')).toBeChecked()
      expect(screen.getByLabelText('Payment processing')).not.toBeChecked()
      expect(screen.queryByText(/Suggested features/)).not.toBeInTheDocument()
    })

    it('still advances with type defaults when the model fails', async () => {
      mockInferProjectDetails.mockRejectedValue(new Error('model down'))
      vi.mocked(getDefaultFeaturesForProjectType).mockReturnValue([
        ProjectFeature.Database,
      ])

      render(<ProjectRequestForm />)

      await goToReview()

      expect(Toast.warning).toHaveBeenCalledWith(
        'Could not generate suggestions. Choose your options below.'
      )
      expect(
        screen.getByText(/We could not generate suggestions/)
      ).toBeInTheDocument()
      expect(screen.getByLabelText('TITLE')).toHaveValue('')
      expect(screen.getByLabelText('PROJECT TYPE *')).toHaveValue(
        ProjectType.Website
      )
      expect(screen.getByText(/▸ FEATURES SELECTED \(1\)/)).toBeInTheDocument()
    })

    it('treats an empty response as a failure and falls back to defaults', async () => {
      mockInferProjectDetails.mockResolvedValue({ data: null })

      render(<ProjectRequestForm />)

      await goToReview()

      expect(Toast.warning).toHaveBeenCalled()
      expect(
        screen.getByText(/We could not generate suggestions/)
      ).toBeInTheDocument()
    })

    it('advances when the form is submitted from a field, not just the button', async () => {
      render(<ProjectRequestForm />)

      fireEvent.change(screen.getByLabelText('PROJECT NAME *'), {
        target: { value: 'My Store' },
      })
      fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
        target: { value: LONG_DESCRIPTION },
      })
      fireEvent.submit(screen.getByLabelText('PROJECT NAME *'))

      expect(await screen.findByLabelText('TITLE')).toBeInTheDocument()
      expect(mockCreateProjectRequest).not.toHaveBeenCalled()
    })
  })

  describe('step 2: review', () => {
    it('shows the remaining fields', async () => {
      render(<ProjectRequestForm />)

      await goToReview()

      expect(screen.getByLabelText('BUDGET (USD)')).toBeInTheDocument()
      expect(screen.getByLabelText('TIMELINE')).toBeInTheDocument()
      expect(
        screen.getByLabelText('PREFERRED CONTACT METHOD')
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText('ADDITIONAL INFORMATION')
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'BACK' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'SUBMIT REQUEST' })
      ).toBeInTheDocument()
      expect(screen.queryByLabelText('DESCRIPTION *')).not.toBeInTheDocument()
    })

    it('lets the user type over the suggested title', async () => {
      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.change(screen.getByLabelText('TITLE'), {
        target: { value: 'My Own Title' },
      })

      expect(screen.getByLabelText('TITLE')).toHaveValue('My Own Title')
    })

    it('resets features to the new type defaults when the type changes', async () => {
      vi.mocked(getDefaultFeaturesForProjectType).mockImplementation(
        (projectType) =>
          projectType === ProjectType.MobileApp ? [ProjectFeature.Auth] : []
      )

      render(<ProjectRequestForm />)

      await goToReview()

      expect(screen.getByText(/▸ FEATURES SELECTED \(2\)/)).toBeInTheDocument()

      fireEvent.change(screen.getByLabelText('PROJECT TYPE *'), {
        target: { value: ProjectType.MobileApp },
      })

      expect(screen.getByLabelText('PROJECT TYPE *')).toHaveValue(
        ProjectType.MobileApp
      )
      expect(screen.getByText(/▸ FEATURES SELECTED \(1\)/)).toBeInTheDocument()
      expect(
        screen.getByText('A native or cross-platform app.')
      ).toBeInTheDocument()
    })

    it('toggles feature selection in the checklist', async () => {
      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.click(screen.getByText(/▸ FEATURES SELECTED/))

      const payments = screen.getByLabelText('Payment processing')

      expect(payments).not.toBeChecked()

      fireEvent.click(payments)

      expect(payments).toBeChecked()
      expect(screen.getByText(/▾ FEATURES SELECTED \(3\)/)).toBeInTheDocument()

      fireEvent.click(payments)

      expect(payments).not.toBeChecked()
    })

    it('handles budget and contact preference changes', async () => {
      render(<ProjectRequestForm />)

      await goToReview()

      fireEvent.change(screen.getByLabelText('BUDGET (USD)'), {
        target: { value: '5000' },
      })

      expect(screen.getByLabelText('BUDGET (USD)')).toHaveValue(5000)

      fireEvent.change(screen.getByLabelText('BUDGET (USD)'), {
        target: { value: '' },
      })

      expect(screen.getByLabelText('BUDGET (USD)')).toHaveValue(null)

      fireEvent.change(screen.getByLabelText('PREFERRED CONTACT METHOD'), {
        target: { value: 'phone' },
      })

      expect(screen.getByLabelText('PREFERRED CONTACT METHOD')).toHaveValue(
        'phone'
      )
    })
  })

  describe('going back', () => {
    it('keeps the name, description, and edits, and does not call the model again if unchanged', async () => {
      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.change(screen.getByLabelText('TITLE'), {
        target: { value: 'My Own Title' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'BACK' }))

      expect(screen.getByLabelText('PROJECT NAME *')).toHaveValue('My Store')
      expect(screen.getByLabelText('DESCRIPTION *')).toHaveValue(
        LONG_DESCRIPTION
      )

      fireEvent.click(
        screen.getByRole('button', { name: 'REVIEW YOUR REQUEST' })
      )

      expect(await screen.findByLabelText('TITLE')).toHaveValue('My Own Title')
      expect(mockInferProjectDetails).toHaveBeenCalledTimes(1)
    })

    it('asks the model again when the description changed', async () => {
      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.click(screen.getByRole('button', { name: 'BACK' }))

      fireEvent.change(screen.getByLabelText('DESCRIPTION *'), {
        target: { value: `${LONG_DESCRIPTION} and a blog` },
      })
      fireEvent.click(
        screen.getByRole('button', { name: 'REVIEW YOUR REQUEST' })
      )

      await screen.findByLabelText('TITLE')

      expect(mockInferProjectDetails).toHaveBeenCalledTimes(2)
    })
  })


  describe('submitting', () => {
    it('validates the full form and submits the reviewed values with the budget as a number', async () => {
      mockCreateProjectRequest.mockResolvedValue({
        data: { createProjectRequest: { id: '1' } },
      })

      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.change(screen.getByLabelText('BUDGET (USD)'), {
        target: { value: '5000' },
      })
      fireEvent.change(screen.getByLabelText('TIMELINE'), {
        target: { value: '2 months' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'SUBMIT REQUEST' }))

      await waitFor(() => {
        expect(mockCreateProjectRequest).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              projectName: 'My Store',
              description: LONG_DESCRIPTION,
              title: 'Handmade Goods Store',
              projectType: ProjectType.WebApp,
              features: [ProjectFeature.Auth, ProjectFeature.Database],
              budget: 5000,
              timeline: '2 months',
              contactPreference: 'email',
            }),
          },
        })
      })
      await waitFor(() => {
        expect(Toast.success).toHaveBeenCalledWith(
          'Project request submitted successfully!'
        )
      })

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('submits without a budget', async () => {
      mockCreateProjectRequest.mockResolvedValue({
        data: { createProjectRequest: { id: '1' } },
      })

      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.click(screen.getByRole('button', { name: 'SUBMIT REQUEST' }))

      await waitFor(() => {
        expect(mockCreateProjectRequest).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({ budget: undefined }),
          },
        })
      })
    })

    it('shows field errors from the full validation and does not submit', async () => {
      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.change(screen.getByLabelText('TIMELINE'), {
        target: { value: 'x'.repeat(101) },
      })
      fireEvent.click(screen.getByRole('button', { name: 'SUBMIT REQUEST' }))

      expect(await screen.findByText('Timeline too long')).toBeInTheDocument()
      expect(mockCreateProjectRequest).not.toHaveBeenCalled()
    })

    it('shows an error toast when the request fails', async () => {
      mockCreateProjectRequest.mockRejectedValue(new Error('API Error'))

      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.click(screen.getByRole('button', { name: 'SUBMIT REQUEST' }))

      await waitFor(() => {
        expect(Toast.error).toHaveBeenCalledWith('API Error')
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('disables back and shows a loading label while submitting', async () => {
      mockCreateProjectRequest.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<ProjectRequestForm />)

      await goToReview()
      fireEvent.click(screen.getByRole('button', { name: 'SUBMIT REQUEST' }))

      expect(
        await screen.findByRole('button', { name: 'SUBMITTING...' })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'BACK' })).toBeDisabled()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'SUBMIT REQUEST' })
        ).toBeInTheDocument()
      })
    })
  })
})
