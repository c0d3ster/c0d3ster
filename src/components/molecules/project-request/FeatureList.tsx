'use client'

import type { ProjectFeature } from '@/graphql/generated/graphql'

import { projectFeatureOptions } from '@/validations'

type FeatureListProps = {
  features: readonly ProjectFeature[] | null | undefined
}

export const FeatureList = ({ features }: FeatureListProps) => {
  if (!features || features.length === 0) {
    return (
      <p className='text-sm text-green-300/60 italic'>No features selected</p>
    )
  }

  const selectedOptions = projectFeatureOptions.filter((option) =>
    features.includes(option.value)
  )

  return (
    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
      {selectedOptions.map(({ value, label }) => (
        <div key={value} className='flex items-center space-x-2'>
          <span className='text-sm text-green-400'>✅</span>
          <span className='text-sm text-green-300/80'>{label}</span>
        </div>
      ))}
    </div>
  )
}
