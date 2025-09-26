import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { logger } from '@/libs/Logger'

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

  it('renders "No requirements specified" when requirements is empty string', () => {
    render(<RequirementsList requirements='' />)

    expect(screen.getByText('No requirements specified')).toBeInTheDocument()
  })

  it('renders error message when requirements is invalid JSON', () => {
    render(<RequirementsList requirements='invalid json' />)

    expect(
      screen.getByText('Error loading requirements: Invalid JSON')
    ).toBeInTheDocument()
    expect(logger.error).toHaveBeenCalledWith(
      'Error parsing requirements JSON',
      {
        error: expect.stringContaining('SyntaxError'),
        requirements: 'invalid json',
      }
    )
  })

  it('renders requirements correctly with all boolean values', () => {
    const requirements = JSON.stringify({
      hasDesign: true,
      needsHosting: false,
      hasDomain: true,
      needsDomain: false,
      needsMaintenance: true,
      needsContentCreation: false,
      needsSEO: true,
    })

    render(<RequirementsList requirements={requirements} />)

    // Check for true requirements (green checkmarks)
    expect(screen.getAllByText('✅')).toHaveLength(4)
    expect(screen.getByText('Has existing design')).toBeInTheDocument()
    expect(screen.getByText('Has domain')).toBeInTheDocument()
    expect(screen.getByText('Needs ongoing maintenance')).toBeInTheDocument()
    expect(screen.getByText('Needs SEO optimization')).toBeInTheDocument()

    // Check for false requirements (red X marks)
    expect(screen.getAllByText('❌')).toHaveLength(4)
    expect(screen.getByText('Needs hosting setup')).toBeInTheDocument()
    expect(screen.getByText('Needs domain')).toBeInTheDocument()
    expect(screen.getByText('Needs content creation')).toBeInTheDocument()
  })

  it('renders features correctly when present', () => {
    const requirements = JSON.stringify({
      hasDesign: true,
      features: [
        'User authentication',
        'Payment processing',
        'Admin dashboard',
      ],
    })

    render(<RequirementsList requirements={requirements} />)

    expect(screen.getByText('Features:')).toBeInTheDocument()
    expect(
      screen.getByText(
        'User authentication, Payment processing, Admin dashboard'
      )
    ).toBeInTheDocument()
  })

  it('renders "None specified" for features when empty array', () => {
    const requirements = JSON.stringify({
      hasDesign: true,
      features: [],
    })

    render(<RequirementsList requirements={requirements} />)

    expect(screen.getByText('Features:')).toBeInTheDocument()
    expect(screen.getByText('None specified')).toBeInTheDocument()
  })

  it('renders "None specified" for features when not present', () => {
    const requirements = JSON.stringify({
      hasDesign: true,
    })

    render(<RequirementsList requirements={requirements} />)

    expect(screen.getByText('Features:')).toBeInTheDocument()
    expect(screen.getByText('None specified')).toBeInTheDocument()
  })

  it('renders all requirement types correctly', () => {
    const requirements = JSON.stringify({
      hasDesign: true,
      needsHosting: false,
      hasDomain: true,
      needsDomain: false,
      needsMaintenance: true,
      needsContentCreation: false,
      needsSEO: true,
      features: ['Feature 1', 'Feature 2'],
    })

    render(<RequirementsList requirements={requirements} />)

    // Check all requirement labels are present
    expect(screen.getByText('Has existing design')).toBeInTheDocument()
    expect(screen.getByText('Needs hosting setup')).toBeInTheDocument()
    expect(screen.getByText('Has domain')).toBeInTheDocument()
    expect(screen.getByText('Needs domain')).toBeInTheDocument()
    expect(screen.getByText('Needs ongoing maintenance')).toBeInTheDocument()
    expect(screen.getByText('Needs content creation')).toBeInTheDocument()
    expect(screen.getByText('Needs SEO optimization')).toBeInTheDocument()
  })

  it('applies correct CSS classes for true requirements', () => {
    const requirements = JSON.stringify({
      hasDesign: true,
      needsHosting: false,
    })

    render(<RequirementsList requirements={requirements} />)

    // Check for green checkmark (true requirement)
    const checkmark = screen.getByText('✅')

    expect(checkmark).toHaveClass('text-green-400')

    // Check for red X (false requirement)
    const xMarks = screen.getAllByText('❌')
    const xMark = xMarks[0] // Get the first one

    expect(xMark).toHaveClass('text-red-400')
  })

  it('applies correct CSS classes for features', () => {
    const requirements = JSON.stringify({
      features: ['Feature 1'],
    })

    render(<RequirementsList requirements={requirements} />)

    const checkmark = screen.getByText('✅')

    expect(checkmark).toHaveClass('text-green-400')
  })

  it('applies correct CSS classes for empty features', () => {
    const requirements = JSON.stringify({
      features: [],
    })

    render(<RequirementsList requirements={requirements} />)

    const xMarks = screen.getAllByText('❌')
    const xMark = xMarks[0] // Get the first one

    expect(xMark).toHaveClass('text-red-400')
  })

  it('handles partial requirements object', () => {
    const requirements = JSON.stringify({
      hasDesign: true,
      // Other requirements are undefined
    })

    render(<RequirementsList requirements={requirements} />)

    // Should show checkmark for hasDesign
    expect(screen.getByText('Has existing design')).toBeInTheDocument()

    // Should show X for other requirements (undefined is falsy)
    expect(screen.getByText('Needs hosting setup')).toBeInTheDocument()
    expect(screen.getByText('Has domain')).toBeInTheDocument()
  })

  it('handles requirements with only features', () => {
    const requirements = JSON.stringify({
      features: ['Only feature'],
    })

    render(<RequirementsList requirements={requirements} />)

    expect(screen.getByText('Features:')).toBeInTheDocument()
    expect(screen.getByText('Only feature')).toBeInTheDocument()
    expect(screen.queryByText('None specified')).not.toBeInTheDocument()
  })

  it('handles empty requirements object', () => {
    const requirements = JSON.stringify({})

    render(<RequirementsList requirements={requirements} />)

    // All requirements should show as false (X marks)
    expect(screen.getAllByText('❌')).toHaveLength(8) // 6 boolean requirements + 1 for features + 1 for empty features
    expect(screen.getByText('None specified')).toBeInTheDocument()
  })

  it('handles malformed JSON with logger error', () => {
    render(<RequirementsList requirements='{"incomplete":' />)

    expect(
      screen.getByText('Error loading requirements: Invalid JSON')
    ).toBeInTheDocument()
    expect(logger.error).toHaveBeenCalledWith(
      'Error parsing requirements JSON',
      {
        error: expect.stringContaining('SyntaxError'),
        requirements: '{"incomplete":',
      }
    )
  })

  it('handles JSON with non-object root', () => {
    render(<RequirementsList requirements='"just a string"' />)

    // This should show the default requirements since it's valid JSON but not an object
    expect(screen.getByText('Has existing design')).toBeInTheDocument()
    expect(screen.getByText('Needs hosting setup')).toBeInTheDocument()
    expect(screen.getByText('Has domain')).toBeInTheDocument()
    expect(screen.getByText('Needs domain')).toBeInTheDocument()
    expect(screen.getByText('Needs ongoing maintenance')).toBeInTheDocument()
    expect(screen.getByText('Needs content creation')).toBeInTheDocument()
    expect(screen.getByText('Needs SEO optimization')).toBeInTheDocument()
  })
})
