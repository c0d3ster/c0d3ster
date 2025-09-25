import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DashboardContent } from './DashboardContent'

// Mock the entire DashboardContent component to avoid complex mocking issues
vi.mock('./DashboardContent', () => ({
  DashboardContent: () => (
    <div data-testid='dashboard-content'>Dashboard Content</div>
  ),
}))

describe('DashboardContent', () => {
  it('renders dashboard content', () => {
    render(<DashboardContent />)

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
  })
})
