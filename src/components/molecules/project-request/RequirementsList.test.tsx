import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RequirementsList } from './RequirementsList'

describe('RequirementsList', () => {
  it('renders "No requirements specified" when requirements is null', () => {
    render(<RequirementsList requirements={null} />)

    expect(screen.getByText('No requirements specified')).toBeInTheDocument()
  })

  it('renders "No requirements specified" when requirements is undefined', () => {
    render(<RequirementsList requirements={undefined} />)

    expect(screen.getByText('No requirements specified')).toBeInTheDocument()
  })

  it('renders checkmarks for true boolean fields', () => {
    render(
      <RequirementsList
        requirements={{ hasDesign: true, needsHosting: false, hasDomain: true }}
      />
    )

    expect(screen.getAllByText('✅')).toHaveLength(2)
    expect(screen.getByText('Has existing design')).toBeInTheDocument()
    expect(screen.getByText('Has domain')).toBeInTheDocument()
  })

  it('renders X marks for false or missing boolean fields', () => {
    render(<RequirementsList requirements={{ hasDesign: false }} />)

    // All 6 fields shown, only hasDesign present (false), rest undefined (also falsy)
    expect(screen.getAllByText('❌')).toHaveLength(6)
  })

  it('renders all requirement labels', () => {
    render(<RequirementsList requirements={{}} />)

    expect(screen.getByText('Has existing design')).toBeInTheDocument()
    expect(screen.getByText('Needs hosting setup')).toBeInTheDocument()
    expect(screen.getByText('Has domain')).toBeInTheDocument()
    expect(screen.getByText('Needs ongoing maintenance')).toBeInTheDocument()
    expect(screen.getByText('Needs content creation')).toBeInTheDocument()
    expect(screen.getByText('Needs SEO optimization')).toBeInTheDocument()
  })

  it('applies correct CSS classes for true and false values', () => {
    render(
      <RequirementsList
        requirements={{ hasDesign: true, needsHosting: false }}
      />
    )

    const checkmark = screen.getByText('✅')

    expect(checkmark).toHaveClass('text-green-400')

    const xMark = screen.getAllByText('❌')[0]

    expect(xMark).toHaveClass('text-red-400')
  })
})
