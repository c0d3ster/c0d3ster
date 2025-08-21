import type { NavItem } from '@/components/organisms'

import { SiteHeader } from '@/components/organisms'

export default function Layout({ children }: { children: React.ReactNode }) {
  // Public site menu items
  const menuItems: NavItem[] = [
    { label: 'HOME', href: '/' },
    { label: 'PORTFOLIO', href: '/projects' },
    { label: 'CONTACT', href: '/#contact' },
  ]

  return (
    <div className='min-h-screen scroll-smooth'>
      <SiteHeader menuItems={menuItems} />
      {children}
    </div>
  )
}
