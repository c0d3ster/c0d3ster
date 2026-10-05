'use client'

import { useState } from 'react'

import type { ProjectFeature, ProjectType } from '@/graphql/generated/graphql'
import type { ProjectRequestData } from '@/validations'

import { Button } from '@/components/atoms'
import {
  contactPreferenceOptions,
  projectFeatureGroups,
  projectFeatureOptions,
  projectTypeDescriptions,
  projectTypeOptions,
} from '@/validations'

import type { FieldErrors, RegisterField } from './projectRequestFormShared'

import {
  FieldError,
  inputClassName,
  labelClassName,
} from './projectRequestFormShared'

const featureLabelByValue = projectFeatureOptions.reduce<
  Record<string, string>
>((labels, option) => {
  labels[option.value] = option.label
  return labels
}, {})

type ProjectRequestReviewStepProps = {
  formData: ProjectRequestData
  errors: FieldErrors
  isSubmitting: boolean
  // 'applied' when the inference filled the suggestions in, 'unavailable' when it failed
  suggestionStatus: 'applied' | 'unavailable'
  registerField: RegisterField
  onChange: (field: keyof ProjectRequestData, value: string) => void
  onProjectTypeChange: (projectType: ProjectType) => void
  onFeatureChange: (feature: ProjectFeature, checked: boolean) => void
  onBack: () => void
}

// Step 2: title, type, and features arrive prefilled and editable, then the client adds
// budget, timeline, and contact details and submits.
export const ProjectRequestReviewStep = ({
  formData,
  errors,
  isSubmitting,
  suggestionStatus,
  registerField,
  onChange,
  onProjectTypeChange,
  onFeatureChange,
  onBack,
}: ProjectRequestReviewStepProps): React.ReactElement => {
  const [showFeatureChecklist, setShowFeatureChecklist] = useState(false)
  const selectedFeatures = formData.features ?? []

  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <h3 className='font-mono text-lg font-bold text-green-400'>
          REVIEW YOUR REQUEST
        </h3>
        <p className='font-mono text-sm text-green-300/70'>
          {suggestionStatus === 'applied'
            ? 'We filled in a title, project type, and features based on your description. Change anything that is off.'
            : 'We could not generate suggestions this time, so these are defaults. Pick the project type and features that fit.'}
        </p>
        <p className='font-mono text-xs text-green-300/60'>
          Project: <span className='text-green-300'>{formData.projectName}</span>
        </p>
      </div>

      {/* Title, type, and features */}
      <div className='space-y-4'>
        <div>
          <label htmlFor='title' className={labelClassName}>
            TITLE
          </label>
          <input
            id='title'
            ref={registerField('title')}
            type='text'
            value={formData.title ?? ''}
            onChange={(e) => onChange('title', e.target.value)}
            className={inputClassName}
            placeholder='A short, descriptive title (optional, defaults to project name)'
          />
          <FieldError error={errors.title} />
        </div>

        <div>
          <label htmlFor='projectType' className={labelClassName}>
            PROJECT TYPE *
          </label>
          <select
            id='projectType'
            ref={registerField('projectType')}
            value={formData.projectType}
            onChange={(e) => {
              const projectType = projectTypeOptions.find(
                (option) => option.value === e.target.value
              )?.value
              if (projectType) onProjectTypeChange(projectType)
            }}
            className={inputClassName}
          >
            {projectTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError error={errors.projectType} />
          <p className='mt-1 font-mono text-sm text-green-300/70 italic'>
            {projectTypeDescriptions[formData.projectType]}
          </p>
        </div>

        {/* Selected features are chips while collapsed, the full checklist when expanded */}
        <div className='space-y-3'>
          <button
            type='button'
            onClick={() => setShowFeatureChecklist((prev) => !prev)}
            className='font-mono text-lg font-bold text-green-400'
          >
            {showFeatureChecklist ? '▾' : '▸'} FEATURES SELECTED (
            {selectedFeatures.length})
          </button>

          {!showFeatureChecklist && (
            <div className='flex flex-wrap gap-2'>
              {selectedFeatures.length > 0 ? (
                selectedFeatures.map((feature) => (
                  <span
                    key={feature}
                    className='rounded-full border border-green-400/40 bg-green-400/10 px-3 py-1 font-mono text-xs text-green-300'
                  >
                    {featureLabelByValue[feature]}
                  </span>
                ))
              ) : (
                <p className='font-mono text-xs text-green-300/60'>
                  No features selected. Expand the list to add some.
                </p>
              )}
            </div>
          )}

          {showFeatureChecklist && (
            <div className='space-y-4'>
              {projectFeatureGroups.map((group) => (
                <div key={group.label} className='space-y-4'>
                  <h4 className='font-mono text-sm font-bold text-green-400/80'>
                    {group.label}
                  </h4>
                  <div className='grid gap-4 md:grid-cols-2'>
                    {group.features.map((featureValue) => (
                      <label
                        key={featureValue}
                        className='flex items-center space-x-3 font-mono text-sm text-green-300'
                      >
                        <input
                          type='checkbox'
                          checked={selectedFeatures.includes(featureValue)}
                          onChange={(e) =>
                            onFeatureChange(featureValue, e.target.checked)
                          }
                          className='size-4 rounded border-green-400/30 bg-black/50 text-green-400 focus:ring-green-400/30'
                        />
                        <span>{featureLabelByValue[featureValue]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget, timeline, contact */}
      <div className='space-y-4'>
        <h3 className='font-mono text-lg font-bold text-green-400'>
          BUDGET, TIMELINE & CONTACT
        </h3>

        <div className='grid gap-2 md:grid-cols-2'>
          <div>
            <label htmlFor='budget' className={labelClassName}>
              BUDGET (USD)
            </label>
            <input
              id='budget'
              ref={registerField('budget')}
              type='number'
              value={formData.budget}
              onChange={(e) => onChange('budget', e.target.value)}
              className={inputClassName}
              placeholder='e.g. 5000'
              min='0'
            />
            <FieldError error={errors.budget} />
          </div>

          <div>
            <label htmlFor='timeline' className={labelClassName}>
              TIMELINE
            </label>
            <input
              id='timeline'
              ref={registerField('timeline')}
              type='text'
              value={formData.timeline}
              onChange={(e) => onChange('timeline', e.target.value)}
              className={inputClassName}
              placeholder='e.g. 2-3 months, ASAP, by end of year'
            />
            <FieldError error={errors.timeline} />
          </div>
        </div>

        <div>
          <label htmlFor='contactPreference' className={labelClassName}>
            PREFERRED CONTACT METHOD
          </label>
          <select
            id='contactPreference'
            ref={registerField('contactPreference')}
            value={formData.contactPreference}
            onChange={(e) => onChange('contactPreference', e.target.value)}
            className={inputClassName}
          >
            {contactPreferenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError error={errors.contactPreference} />
        </div>

        <div>
          <label htmlFor='additionalInfo' className={labelClassName}>
            ADDITIONAL INFORMATION
          </label>
          <textarea
            id='additionalInfo'
            ref={registerField('additionalInfo')}
            value={formData.additionalInfo}
            onChange={(e) => onChange('additionalInfo', e.target.value)}
            rows={4}
            className={inputClassName}
            placeholder='Any additional details, inspiration websites, specific requirements, or questions you have...'
          />
          <FieldError error={errors.additionalInfo} />
        </div>
      </div>

      <div className='flex justify-end space-x-4'>
        <Button type='button' onClick={onBack} disabled={isSubmitting}>
          BACK
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
        </Button>
      </div>
    </div>
  )
}
