import type { Metadata } from 'next'

import { RoleInvoiceDetail } from '@/components/molecules'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Invoice - ${BRAND_NAME}`,
}

type PageProps = {
  params: Promise<{ id: string }>
}

const InvoicePage = async ({ params }: PageProps) => {
  const { id } = await params

  return <RoleInvoiceDetail id={id} />
}

export default InvoicePage
