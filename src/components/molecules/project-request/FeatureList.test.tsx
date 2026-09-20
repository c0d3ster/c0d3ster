import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectFeature } from '@/graphql/generated/graphql'

import { FeatureList } from './FeatureList'

describe('FeatureList', () => {
  it('renders "No features selected" when features is null', () => {
    render(<FeatureList features={null} />)

    expect(screen.getByText('No features selected')).toBeInTheDocument()
  })

  it('renders "No features selected" when features is undefined', () => {
    render(<FeatureList features={undefined} />)

    expect(screen.getByText('No features selected')).toBeInTheDocument()
  })

  it('renders "No features selected" when features is an empty array', () => {
    render(<FeatureList features={[]} />)

    expect(screen.getByText('No features selected')).toBeInTheDocument()
  })

  it('renders only the selected features, with a checkmark each', () => {
    render(
      <FeatureList
        features={[ProjectFeature.Database, ProjectFeature.Auth]}
      />
    )

    expect(screen.getAllByText('✅')).toHaveLength(2)
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Auth')).toBeInTheDocument()
    expect(screen.queryByText('Email')).not.toBeInTheDocument()
  })

  it('applies the checkmark styling', () => {
    render(<FeatureList features={[ProjectFeature.Database]} />)

    expect(screen.getByText('✅')).toHaveClass('text-green-400')
  })
})
