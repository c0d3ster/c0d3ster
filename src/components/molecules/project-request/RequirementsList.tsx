'use client'

import { logger } from '@/libs/Logger'

type RequirementsListProps = {
  requirements: string | null | undefined
}

type RequirementsObject = {
  hasDesign?: boolean
  needsHosting?: boolean
  hasDomain?: boolean
  needsDomain?: boolean
  needsMaintenance?: boolean
  needsContentCreation?: boolean
  needsSEO?: boolean
  features?: string[]
}

export const RequirementsList = ({ requirements }: RequirementsListProps) => {
  if (!requirements) {
    return (
      <p className='text-sm text-green-300/60 italic'>
        No requirements specified
      </p>
    )
  }

  // Parse the JSON string from the GraphQL resolver
  let parsedRequirements: RequirementsObject
  try {
    parsedRequirements = JSON.parse(requirements)
  } catch (error) {
    logger.error('Error parsing requirements JSON', {
      error: String(error),
      requirements,
    })
    return (
      <p className='text-sm text-red-400/80 italic'>
        Error loading requirements: Invalid JSON
      </p>
    )
  }

  // Define all possible requirements with their labels
  const requirementItems = [
    { key: 'hasDesign', label: 'Has existing design' },
    { key: 'needsHosting', label: 'Needs hosting setup' },
    { key: 'hasDomain', label: 'Has domain' },
    { key: 'needsDomain', label: 'Needs domain' },
    { key: 'needsMaintenance', label: 'Needs ongoing maintenance' },
    { key: 'needsContentCreation', label: 'Needs content creation' },
    { key: 'needsSEO', label: 'Needs SEO optimization' },
  ] as const

  return (
    <div className='space-y-2'>
      {/* Display requirements in a 2-column grid */}
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {requirementItems.map(({ key, label }) => {
          const isRequired = parsedRequirements[key] === true
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

      {/* Handle features separately - full width */}
      <div className='flex items-start space-x-2'>
        <span
          className={`text-sm ${
            parsedRequirements.features &&
            parsedRequirements.features.length > 0
              ? 'text-green-400'
              : 'text-red-400'
          }`}
        >
          {parsedRequirements.features && parsedRequirements.features.length > 0
            ? '✅'
            : '❌'}
        </span>
        <div className='flex-1'>
          <span className='text-sm text-green-300/80'>Features: </span>
          {parsedRequirements.features &&
          parsedRequirements.features.length > 0 ? (
            <span className='text-sm text-green-400'>
              {parsedRequirements.features.join(', ')}
            </span>
          ) : (
            <span className='text-sm text-green-300/60'>None specified</span>
          )}
        </div>
      </div>
    </div>
  )
}
