'use client'

import { usePathname } from 'next/navigation'

import { BackButton } from '@/components/atoms'

const INVOICES_PATH = '/dashboard/invoices'

// Invoice detail, edit and new pages go back to the invoice list; everything else leaves the dashboard
export const DashboardBackButton = (): React.ReactElement => {
  const pathname = usePathname()
  const inInvoiceSubpage = pathname.startsWith(`${INVOICES_PATH}/`)

  return inInvoiceSubpage ? (
    <BackButton href={INVOICES_PATH} text='BACK TO INVOICES' />
  ) : (
    <BackButton href='/' text='BACK TO SITE' />
  )
}
