'use client'

import { useGetMyInvoices } from '@/apiClients/invoiceApiClient'
import { useGetMe } from '@/apiClients/userApiClient'
import { isAdminRole } from '@/utils/RoleConstants'

import type { NavItem } from './SiteHeader'

import { SiteHeader } from './SiteHeader'

const INVOICES_ITEM: NavItem = {
  label: 'INVOICES',
  href: '/dashboard/invoices',
}

type DashboardHeaderProps = {
  menuItems: NavItem[]
}

// Admins always get the invoices tab; clients only once they have been sent one
export const DashboardHeader = ({
  menuItems,
}: DashboardHeaderProps): React.ReactElement => {
  const { data: meData } = useGetMe()
  const { data: invoiceData } = useGetMyInvoices()

  const showInvoices =
    isAdminRole(meData?.me?.role) ||
    (invoiceData?.getMyInvoices.length ?? 0) > 0

  const items = showInvoices
    ? [menuItems[0], INVOICES_ITEM, ...menuItems.slice(1)].filter(
        (item): item is NavItem => item !== undefined
      )
    : menuItems

  return <SiteHeader menuItems={items} isDashboard />
}
