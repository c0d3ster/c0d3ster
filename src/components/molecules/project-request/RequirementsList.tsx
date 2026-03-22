'use client'

import type { ProjectRequirements } from '@/graphql/generated/graphql'

type RequirementsListProps = {
  requirements: ProjectRequirements | null | undefined
}

const REQUIREMENT_ITEMS = [
  { key: 'hasDesign', label: 'Has existing design' },
  { key: 'needsHosting', label: 'Needs hosting setup' },
  { key: 'hasDomain', label: 'Has domain' },
  { key: 'needsMaintenance', label: 'Needs ongoing maintenance' },
  { key: 'needsContentCreation', label: 'Needs content creation' },
  { key: 'needsSEO', label: 'Needs SEO optimization' },
] as const

export const RequirementsList = ({ requirements }: RequirementsListProps) => {
  if (!requirements) {
    return (
      <p className='text-sm text-green-300/60 italic'>
        No requirements specified
      </p>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
      {REQUIREMENT_ITEMS.map(({ key, label }) => {
        const isRequired = requirements[key] === true
        return (
          <div key={key} className='flex items-center space-x-2'>
            <span
              className={`text-sm ${isRequired ? 'text-green-400' : 'text-red-400'}`}
            >
              {isRequired ? '✅' : '❌'}
            </span>
            <span className='text-sm text-green-300/80'>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
