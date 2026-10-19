import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardBackButton } from './DashboardBackButton'

const mockPathname = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  usePathname: mockPathname,
  useRouter: () => ({ back: vi.fn() }),
}))

describe('DashboardBackButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    '/dashboard/invoices/inv-1',
    '/dashboard/invoices/inv-1/edit',
    '/dashboard/invoices/new',
  ])('goes back to the invoice list from %s', (path) => {
    mockPathname.mockReturnValue(path)
    render(<DashboardBackButton />)

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/invoices'
    )
    expect(screen.getByText('BACK TO INVOICES')).toBeInTheDocument()
  })

  it.each(['/dashboard', '/dashboard/invoices', '/dashboard/user-profile'])(
    'goes back to the site from %s',
    (path) => {
      mockPathname.mockReturnValue(path)
      render(<DashboardBackButton />)

      expect(screen.getByRole('link')).toHaveAttribute('href', '/')
      expect(screen.getByText('BACK TO SITE')).toBeInTheDocument()
    }
  )
})
