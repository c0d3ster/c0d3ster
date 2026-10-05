'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { ProjectFeature } from '@/graphql/generated/graphql'
import type { ProjectRequestData } from '@/validations'

import { useCreateProjectRequest, useInferProjectDetails } from '@/apiClients'
import { ProjectType } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'
import {
  getDefaultFeaturesForProjectType,
  projectDescriptionSchema,
  projectRequestSchema,
} from '@/validations'

import type { FieldErrors } from './projectRequestFormShared'

import { ProjectRequestDescribeStep } from './ProjectRequestDescribeStep'
import { ProjectRequestReviewStep } from './ProjectRequestReviewStep'

type Step = 'describe' | 'review'

const STEP_LABELS: Record<Step, string> = {
  describe: 'STEP 1 OF 2: DESCRIBE',
  review: 'STEP 2 OF 2: REVIEW',
}

// Fields in on-screen order, so the first invalid one gets focus
const FIELD_ORDER: readonly (keyof ProjectRequestData)[] = [
  'projectName',
  'description',
  'title',
  'projectType',
  'budget',
  'timeline',
  'contactPreference',
  'additionalInfo',
]

const collectErrors = (
  issues: readonly { path: PropertyKey[]; message: string }[]
): FieldErrors => {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const key = FIELD_ORDER.find((name) => name === issue.path[0])
    // Only keep the first error per field
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
}

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

export const ProjectRequestForm = () => {
  const router = useRouter()
  const [step, setStep] = useState<Step>('describe')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [createProjectRequest] = useCreateProjectRequest()
  const [inferProjectDetails, { loading: isAnalyzing }] =
    useInferProjectDetails()
  const [suggestionStatus, setSuggestionStatus] = useState<
    'applied' | 'unavailable'
  >('applied')
  // The name + description the current suggestions were generated from, so going back and
  // forward without editing them does not call the model again or overwrite the user's edits
  const [analyzedKey, setAnalyzedKey] = useState<string | null>(null)

  // Refs for form fields to enable focusing
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})
  const registerField = (field: string) => (el: HTMLElement | null) => {
    fieldRefs.current[field] = el
  }

  const [formData, setFormData] = useState<ProjectRequestData>(() => ({
    projectName: '',
    title: '',
    description: '',
    projectType: ProjectType.Website,
    budget: '',
    timeline: '',
    contactPreference: 'email',
    additionalInfo: '',
    features: getDefaultFeaturesForProjectType(ProjectType.Website),
  }))

  // Start each step on its first field
  useEffect(() => {
    fieldRefs.current[step === 'describe' ? 'projectName' : 'title']?.focus()
  }, [step])

  const focusFirstError = (validationErrors: FieldErrors) => {
    const field = FIELD_ORDER.find(
      (name) => validationErrors[name] && fieldRefs.current[name]
    )
    if (!field) return

    fieldRefs.current[field]?.focus()
    fieldRefs.current[field]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  const handleInputChange = (
    field: keyof ProjectRequestData,
    value: string
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

  const handleProjectTypeChange = (projectType: ProjectType) => {
    setFormData((prev) => ({
      ...prev,
      projectType,
      features: getDefaultFeaturesForProjectType(projectType),
    }))
    if (errors.projectType) {
      setErrors((prev) => ({
        ...prev,
        projectType: '',
      }))
    }
  }

  const handleFeatureChange = (feature: ProjectFeature, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.features ?? []
      return {
        ...prev,
        features: checked
          ? [...current, feature]
          : current.filter((f) => f !== feature),
      }
    })
  }

  // Step 1 -> 2: validate name + description, then ask the model for type, title, and features
  const handleNext = async () => {
    setErrors({})

    const result = projectDescriptionSchema.safeParse(formData)
    if (!result.success) {
      const validationErrors = collectErrors(result.error.issues)
      setErrors(validationErrors)
      focusFirstError(validationErrors)
      return
    }

    const key = `${result.data.projectName.trim()}\n${result.data.description.trim()}`
    if (key === analyzedKey) {
      setStep('review')
      return
    }

    try {
      const response = await inferProjectDetails({
        variables: {
          input: {
            projectName: result.data.projectName,
            description: result.data.description,
          },
        },
      })

      const suggestion = response.data?.inferProjectDetails
      if (!suggestion) {
        throw new Error('No suggestion returned')
      }

      setFormData((prev) => ({
        ...prev,
        projectType: suggestion.projectType,
        title: suggestion.title,
        features: [...suggestion.features],
      }))
      setSuggestionStatus('applied')
    } catch {
      // Never block the request on the suggestion: fall back to the type defaults
      setFormData((prev) => ({
        ...prev,
        features: getDefaultFeaturesForProjectType(prev.projectType),
      }))
      setSuggestionStatus('unavailable')
      Toast.warning('Could not generate suggestions. Choose your options below.')
    }

    setAnalyzedKey(key)
    setStep('review')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    try {
      // Validate form data
      const result = projectRequestSchema.safeParse(formData)
      if (!result.success) {
        const validationErrors = collectErrors(result.error.issues)
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
    } catch (error: unknown) {
      Toast.error(errorMessage(error, 'Failed to submit request'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Enter in a field submits the form, which should advance step 1, not submit the request
    return step === 'describe' ? handleNext() : handleSubmit()
  }

  return (
    <form onSubmit={handleFormSubmit} className='space-y-8'>
      <p className='font-mono text-xs tracking-widest text-green-300/60'>
        {STEP_LABELS[step]}
      </p>

      {step === 'describe' ? (
        <ProjectRequestDescribeStep
          formData={formData}
          errors={errors}
          isAnalyzing={isAnalyzing}
          registerField={registerField}
          onChange={handleInputChange}
          onCancel={() => router.back()}
        />
      ) : (
        <ProjectRequestReviewStep
          formData={formData}
          errors={errors}
          isSubmitting={isSubmitting}
          suggestionStatus={suggestionStatus}
          registerField={registerField}
          onChange={handleInputChange}
          onProjectTypeChange={handleProjectTypeChange}
          onFeatureChange={handleFeatureChange}
          onBack={() => setStep('describe')}
        />
      )}
    </form>
  )
}
