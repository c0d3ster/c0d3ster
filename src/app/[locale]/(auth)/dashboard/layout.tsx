import { setRequestLocale } from 'next-intl/server'

import type { NavItem } from '@/components/organisms'

import { BackButton } from '@/components/atoms'
import { SiteHeader } from '@/components/organisms'

export default async function DashboardLayout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  setRequestLocale(locale)

  // Dashboard menu items
  const menuItems: NavItem[] = [
    { label: 'DASHBOARD', href: '/dashboard' },
    { label: 'USER PROFILE', href: '/dashboard/user-profile' },
  ]

  return (
    <div className='bg-black'>
      <SiteHeader menuItems={menuItems} isDashboard />
      <BackButton href={`/${locale}`} text='BACK TO SITE' />
      {/* Content - No wrapper needed */}
      {props.children}
    </div>
  )
}
