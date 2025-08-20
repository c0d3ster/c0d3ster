import type { NavItem } from '@/components/organisms'

import { BackButton } from '@/components/atoms'
import { SiteHeader } from '@/components/organisms'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Dashboard menu items
  const menuItems: NavItem[] = [
    { label: 'DASHBOARD', href: '/dashboard' },
    { label: 'USER PROFILE', href: '/dashboard/user-profile' },
  ]

  return (
    <div className='bg-black'>
      <SiteHeader menuItems={menuItems} isDashboard />
      <BackButton href='/' text='BACK TO SITE' />
      {/* Content - No wrapper needed */}
      {children}
    </div>
  )
}
