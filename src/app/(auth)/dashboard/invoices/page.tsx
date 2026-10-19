import type { Metadata } from 'next'

import { RoleInvoiceList } from '@/components/molecules'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Invoices - ${BRAND_NAME}`,
}

const InvoicesPage = () => <RoleInvoiceList />

export default InvoicesPage
