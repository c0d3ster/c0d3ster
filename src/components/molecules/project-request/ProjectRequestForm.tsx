'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { ProjectRequestData } from '@/validations'

import { Button } from '@/components/atoms'
import { useToast } from '@/hooks'
import {
  contactPreferenceOptions,
  projectRequestSchema,
  projectTypeOptions,
} from '@/validations'

export const ProjectRequestForm = () => {
  const router = useRouter()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ProjectRequestData>({
    title: '',
    description: '',
    projectType: 'website',
    budget: '',
    timeline: '',
    contactPreference: 'email',
    additionalInfo: '',
    requirements: {
      hasDesign: false,
      needsHosting: false,
      needsDomain: false,
      needsMaintenance: false,
      needsContentCreation: false,
      needsSEO: false,
      features: [],
    },
  })

  const handleInputChange = (
    field: keyof ProjectRequestData,
    value: string | boolean
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
      const validatedData = projectRequestSchema.parse(formData)

      // Submit to API
      const response = await fetch('/api/project-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      showToast('Project request submitted successfully!', 'success')
      router.push('/dashboard')
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error')
      }

      // Handle validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors: Record<string, string> = {}
        ;(error as any).issues.forEach((issue: any) => {
          if (issue.path && issue.path.length > 0) {
            validationErrors[issue.path[0]] = issue.message
          }
        })
        setErrors(validationErrors)
      }
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

        {/* Title */}
        <div>
          <label
            htmlFor='title'
            className='block font-mono text-sm font-medium text-green-300'
          >
            PROJECT TITLE *
          </label>
          <input
            id='title'
            type='text'
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
            placeholder='e.g., E-commerce website for my business'
          />
          {errors.title && (
            <p className='mt-1 font-mono text-sm text-red-400'>
              {errors.title}
            </p>
          )}
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
          {errors.projectType && (
            <p className='mt-1 font-mono text-sm text-red-400'>
              {errors.projectType}
            </p>
          )}
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
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={5}
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
            placeholder='Describe your project in detail. What are your goals? What features do you need? Who is your target audience?'
          />
          {errors.description && (
            <p className='mt-1 font-mono text-sm text-red-400'>
              {errors.description}
            </p>
          )}
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
              type='number'
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
              placeholder='e.g., 5000'
              min='0'
            />
            {errors.budget && (
              <p className='mt-1 font-mono text-sm text-red-400'>
                {errors.budget}
              </p>
            )}
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
              type='text'
              value={formData.timeline}
              onChange={(e) => handleInputChange('timeline', e.target.value)}
              className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
              placeholder='e.g., 2-3 months, ASAP, by end of year'
            />
            {errors.timeline && (
              <p className='mt-1 font-mono text-sm text-red-400'>
                {errors.timeline}
              </p>
            )}
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
            { key: 'needsDomain', label: 'I need domain management' },
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
          {errors.contactPreference && (
            <p className='mt-1 font-mono text-sm text-red-400'>
              {errors.contactPreference}
            </p>
          )}
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
            value={formData.additionalInfo}
            onChange={(e) =>
              handleInputChange('additionalInfo', e.target.value)
            }
            rows={4}
            className='mt-2 block w-full rounded border border-green-400/30 bg-black/50 px-4 py-3 font-mono text-green-400 placeholder-green-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 focus:outline-none'
            placeholder='Any additional details, inspiration websites, specific requirements, or questions you have...'
          />
          {errors.additionalInfo && (
            <p className='mt-1 font-mono text-sm text-red-400'>
              {errors.additionalInfo}
            </p>
          )}
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
