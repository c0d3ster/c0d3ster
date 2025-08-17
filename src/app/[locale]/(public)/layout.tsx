import { setRequestLocale } from 'next-intl/server'

import type { NavItem } from '@/components/organisms'

import { SiteHeader } from '@/components/organisms'

export default async function Layout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  setRequestLocale(locale)

  // Public site menu items
  const menuItems: NavItem[] = [
    { label: 'HOME', href: '/' },
    { label: 'PORTFOLIO', href: '/projects' },
    { label: 'CONTACT', href: '/#contact' },
  ]

  return (
    <div className='min-h-screen scroll-smooth'>
      <SiteHeader menuItems={menuItems} />
      {props.children}
    </div>
  )
}
