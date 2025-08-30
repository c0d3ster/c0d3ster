'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import type { ProjectRequestData } from '@/validations'

import { useCreateProjectRequest } from '@/apiClients'
import { Button } from '@/components/atoms'
import { ProjectType } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'
import {
  contactPreferenceOptions,
  projectRequestSchema,
  projectTypeOptions,
} from '@/validations'

// Helper component to reserve space for error messages
const ErrorMessage = ({ error }: { error?: string }) => (
  <div className='mt-1 h-5 font-mono text-sm text-red-400'>
    {error && <p>{error}</p>}
  </div>
)

export const ProjectRequestForm = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectRequestData, string>>
  >({})
  const [createProjectRequest] = useCreateProjectRequest()

  // Refs for form fields to enable focusing
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})

  // Function to focus on first field with error
  const focusFirstError = (validationErrors: Record<string, string>) => {
    const fieldOrder = [
      'projectName',
      'projectType',
      'description',
      'budget',
      'timeline',
      'contactPreference',
      'additionalInfo',
    ]

    for (const field of fieldOrder) {
      if (validationErrors[field] && fieldRefs.current[field]) {
        fieldRefs.current[field]?.focus()
        fieldRefs.current[field]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        break
      }
    }
  }

  const [formData, setFormData] = useState<ProjectRequestData>({
    projectName: '',
    description: '',
    projectType: ProjectType.Website,
    budget: '',
    timeline: '',
    contactPreference: 'email',
    additionalInfo: '',
    requirements: {
      hasDesign: false,
      hasDomain: false,
      needsHosting: false,
      needsMaintenance: false,
      needsContentCreation: false,
      needsSEO: false,
      features: [],
    },
  })

  const handleInputChange = (
    field: keyof ProjectRequestData,
    value: string | boolean | ProjectType
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleRequirementChange = (
    requirement: keyof NonNullable<ProjectRequestData['requirements']>,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [requirement]: checked,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Validate form data
      const result = projectRequestSchema.safeParse(formData)
      if (!result.success) {
        const validationErrors: Partial<
          Record<keyof ProjectRequestData, string>
        > = {}
        // Set all validation errors for field highlighting
        for (const issue of result.error.issues) {
          const pathKey = issue.path[0] as keyof ProjectRequestData
          // Only keep the first error per field
          if (pathKey && !validationErrors[pathKey]) {
            validationErrors[pathKey] = issue.message
          }
        }
        setErrors(validationErrors)
        focusFirstError(validationErrors)
        return
      }
      const validatedData = result.data

      // Submit via GraphQL
      const graphqlResult = await createProjectRequest({
        variables: {
          input: {
            ...validatedData,
            budget: validatedData.budget
              ? Number.parseFloat(validatedData.budget)
              : undefined,
          },
        },
      })

      if (graphqlResult.data?.createProjectRequest) {
        Toast.success('Project request submitted successfully!')
        router.push('/dashboard')
      } else {
        throw new Error('Failed to submit request')
      }
    } catch (error: any) {
      Toast.error(error.message || 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Project Details Section */}
      <div className='space-y-6'>
        <h3 className='font-mono text-lg font-bold text-green-400'>
          PROJECT DETAILS
        </h3>

        {/* Project Name */}
        <div>
          <label
            htmlFor='projectName'
            className='block font-mono text-sm font-medium text-green-300'
          >
            PROJECT NAME *
          </label>
          <input
            id='projectName'
            ref={(el) => {
              fieldRefs.current.projectName = el
            }}
            type='text'
            value={formData.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
            placeholder='e.g., My E-commerce Store'
          />
          <ErrorMessage error={errors.projectName} />
        </div>

        {/* Project Type */}
        <div>
          <label
            htmlFor='projectType'
            className='block font-mono text-sm font-medium text-green-300'
          >
            PROJECT TYPE *
          </label>
          <select
            id='projectType'
            ref={(el) => {
              fieldRefs.current.projectType = el
            }}
            value={formData.projectType}
            onChange={(e) => handleInputChange('projectType', e.target.value)}
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
          >
            {projectTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ErrorMessage error={errors.projectType} />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor='description'
            className='block font-mono text-sm font-medium text-green-300'
          >
            DESCRIPTION *
          </label>
          <textarea
            id='description'
            ref={(el) => {
              fieldRefs.current.description = el
            }}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={5}
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
            placeholder='Describe your project in detail. What are your goals? What features do you need? Who is your target audience?'
          />
          <ErrorMessage error={errors.description} />
        </div>

        {/* Budget and Timeline */}
        <div className='grid gap-6 md:grid-cols-2'>
          <div>
            <label
              htmlFor='budget'
              className='block font-mono text-sm font-medium text-green-300'
            >
              BUDGET (USD)
            </label>
            <input
              id='budget'
              ref={(el) => {
                fieldRefs.current.budget = el
              }}
              type='number'
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
              placeholder='e.g., 5000'
              min='0'
            />
            <ErrorMessage error={errors.budget} />
          </div>

          <div>
            <label
              htmlFor='timeline'
              className='block font-mono text-sm font-medium text-green-300'
            >
              TIMELINE
            </label>
            <input
              id='timeline'
              ref={(el) => {
                fieldRefs.current.timeline = el
              }}
              type='text'
              value={formData.timeline}
              onChange={(e) => handleInputChange('timeline', e.target.value)}
              className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
              placeholder='e.g., 2-3 months, ASAP, by end of year'
            />
            <ErrorMessage error={errors.timeline} />
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className='space-y-6'>
        <h3 className='font-mono text-lg font-bold text-green-400'>
          REQUIREMENTS
        </h3>

        <div className='grid gap-4 md:grid-cols-2'>
          {[
            { key: 'hasDesign', label: 'I already have a design' },
            { key: 'needsHosting', label: 'I need hosting setup' },
            { key: 'hasDomain', label: 'I already have a domain' },
            { key: 'needsMaintenance', label: 'I need ongoing maintenance' },
            { key: 'needsContentCreation', label: 'I need content creation' },
            { key: 'needsSEO', label: 'I need SEO optimization' },
          ].map((requirement) => (
            <label
              key={requirement.key}
              className='flex items-center space-x-3 font-mono text-sm text-green-300'
            >
              <input
                type='checkbox'
                checked={
                  (formData.requirements?.[
                    requirement.key as keyof NonNullable<
                      ProjectRequestData['requirements']
                    >
                  ] as boolean) || false
                }
                onChange={(e) =>
                  handleRequirementChange(
                    requirement.key as keyof NonNullable<
                      ProjectRequestData['requirements']
                    >,
                    e.target.checked
                  )
                }
                className='h-4 w-4 rounded border-green-400/30 bg-black/50 text-green-400 focus:ring-green-400/30'
              />
              <span>{requirement.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Contact & Additional Info */}
      <div className='space-y-6'>
        <h3 className='font-mono text-lg font-bold text-green-400'>
          CONTACT & ADDITIONAL INFO
        </h3>

        {/* Contact Preference */}
        <div>
          <label
            htmlFor='contactPreference'
            className='block font-mono text-sm font-medium text-green-300'
          >
            PREFERRED CONTACT METHOD
          </label>
          <select
            id='contactPreference'
            ref={(el) => {
              fieldRefs.current.contactPreference = el
            }}
            value={formData.contactPreference}
            onChange={(e) =>
              handleInputChange('contactPreference', e.target.value)
            }
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
          >
            {contactPreferenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ErrorMessage error={errors.contactPreference} />
        </div>

        {/* Additional Info */}
        <div>
          <label
            htmlFor='additionalInfo'
            className='block font-mono text-sm font-medium text-green-300'
          >
            ADDITIONAL INFORMATION
          </label>
          <textarea
            id='additionalInfo'
            ref={(el) => {
              fieldRefs.current.additionalInfo = el
            }}
            value={formData.additionalInfo}
            onChange={(e) =>
              handleInputChange('additionalInfo', e.target.value)
            }
            rows={4}
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
            placeholder='Any additional details, inspiration websites, specific requirements, or questions you have...'
          />
          <ErrorMessage error={errors.additionalInfo} />
        </div>
      </div>

      {/* Submit Button */}
      <div className='flex justify-end space-x-4'>
        <Button
          type='button'
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          CANCEL
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
        </Button>
      </div>
    </form>
  )
}
