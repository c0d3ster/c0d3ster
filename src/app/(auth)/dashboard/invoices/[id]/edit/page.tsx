import type { Metadata } from 'next'

import { AdminInvoiceDetail } from '@/components/molecules'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Edit Invoice - ${BRAND_NAME}`,
}

type PageProps = {
  params: Promise<{ id: string }>
}

const EditInvoicePage = async ({ params }: PageProps) => {
  const { id } = await params

  return <AdminInvoiceDetail id={id} editing />
}

export default EditInvoicePage
