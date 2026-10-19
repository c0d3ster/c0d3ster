import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NavItem } from './SiteHeader'

import { DashboardHeader } from './DashboardHeader'

const mockUseGetMe = vi.hoisted(() => vi.fn())
const mockUseGetMyInvoices = vi.hoisted(() => vi.fn())

vi.mock('@/apiClients/userApiClient', () => ({ useGetMe: mockUseGetMe }))
vi.mock('@/apiClients/invoiceApiClient', () => ({
  useGetMyInvoices: mockUseGetMyInvoices,
}))
vi.mock('./SiteHeader', () => ({
  SiteHeader: ({ menuItems }: { menuItems: NavItem[] }) => (
    <nav>{menuItems.map(({ label }) => label).join(',')}</nav>
  ),
}))

const menuItems: NavItem[] = [
  { label: 'DASHBOARD', href: '/dashboard' },
  { label: 'USER PROFILE', href: '/dashboard/user-profile' },
]

const setup = (role: string, invoiceCount: number): void => {
  mockUseGetMe.mockReturnValue({ data: { me: { role } } })
  mockUseGetMyInvoices.mockReturnValue({
    data: { getMyInvoices: Array.from({ length: invoiceCount }, () => ({})) },
  })
}

describe('DashboardHeader', () => {
  beforeEach(() => vi.clearAllMocks())

  afterEach(cleanup)

  it('always shows the invoices tab to admins', () => {
    setup('Admin', 0)
    render(<DashboardHeader menuItems={menuItems} />)

    expect(screen.getByRole('navigation').textContent).toBe(
      'DASHBOARD,INVOICES,USER PROFILE'
    )
  })

  it('shows the invoices tab to clients who have invoices', () => {
    setup('Client', 2)
    render(<DashboardHeader menuItems={menuItems} />)

    expect(screen.getByRole('navigation').textContent).toContain('INVOICES')
  })

  it('hides the invoices tab from clients with no invoices', () => {
    setup('Client', 0)
    render(<DashboardHeader menuItems={menuItems} />)

    expect(screen.getByRole('navigation').textContent).toBe(
      'DASHBOARD,USER PROFILE'
    )
  })
})
