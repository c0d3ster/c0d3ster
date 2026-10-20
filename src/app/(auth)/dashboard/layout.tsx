import type { NavItem } from '@/components/organisms'

import { DashboardBackButton, DashboardHeader } from '@/components/organisms'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Dashboard menu items
  const menuItems: NavItem[] = [
    { label: 'DASHBOARD', href: '/dashboard', shortLabel: 'DASH' },
    {
      label: 'REQUEST PROJECT',
      href: '/dashboard/request-project',
      shortLabel: 'REQ',
    },
    {
      label: 'USER PROFILE',
      href: '/dashboard/user-profile',
      shortLabel: 'PROF',
    },
  ]

  return (
    <div className='bg-black'>
      <DashboardHeader menuItems={menuItems} />
      <DashboardBackButton />
      {/* Content - No wrapper needed */}
      {children}
    </div>
  )
}
