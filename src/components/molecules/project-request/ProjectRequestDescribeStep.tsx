'use client'

import type { ProjectRequestData } from '@/validations'

import { Button } from '@/components/atoms'

import type { FieldErrors, RegisterField } from './projectRequestFormShared'

import {
  FieldError,
  inputClassName,
  labelClassName,
} from './projectRequestFormShared'

type ProjectRequestDescribeStepProps = {
  formData: ProjectRequestData
  errors: FieldErrors
  isAnalyzing: boolean
  registerField: RegisterField
  onChange: (field: 'projectName' | 'description', value: string) => void
  onCancel: () => void
}

// Step 1: just a name and a description. The Next button (a form submit) runs the
// inference and moves to the review step with type, title, and features prefilled.
export const ProjectRequestDescribeStep = ({
  formData,
  errors,
  isAnalyzing,
  registerField,
  onChange,
  onCancel,
}: ProjectRequestDescribeStepProps): React.ReactElement => (
  <div className='space-y-2'>
    <h3 className='mb-1 font-mono text-lg font-bold text-green-400'>
      TELL US ABOUT YOUR PROJECT
    </h3>
    <p className='mb-4 font-mono text-sm text-green-300/70'>
      Start with a name and a description. We will suggest a project type,
      title, and features for you to review on the next step.
    </p>

    <div>
      <label htmlFor='projectName' className={labelClassName}>
        PROJECT NAME *
      </label>
      <input
        id='projectName'
        ref={registerField('projectName')}
        type='text'
        value={formData.projectName}
        onChange={(e) => onChange('projectName', e.target.value)}
        className={inputClassName}
        placeholder='e.g. My E-commerce Store'
      />
      <FieldError error={errors.projectName} />
    </div>

    <div>
      <label htmlFor='description' className={labelClassName}>
        DESCRIPTION *
      </label>
      <textarea
        id='description'
        ref={registerField('description')}
        value={formData.description}
        onChange={(e) => onChange('description', e.target.value)}
        rows={6}
        className={inputClassName}
        placeholder='Describe your project in detail. What are your goals? What features do you need? Who is your target audience?'
      />
      <FieldError error={errors.description} />
    </div>

    <div className='flex justify-end space-x-4 pt-4'>
      <Button type='button' onClick={onCancel} disabled={isAnalyzing}>
        CANCEL
      </Button>
      <Button type='submit' disabled={isAnalyzing}>
        {isAnalyzing ? 'ANALYZING...' : 'REVIEW YOUR REQUEST'}
      </Button>
    </div>
  </div>
)
