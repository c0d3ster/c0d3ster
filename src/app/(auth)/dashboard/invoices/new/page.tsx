import type { Metadata } from 'next'

import { CreateInvoiceForm } from '@/components/molecules'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `New Invoice - ${BRAND_NAME}`,
}

type PageProps = {
  searchParams: Promise<{ projectId?: string }>
}

const NewInvoicePage = async ({ searchParams }: PageProps) => {
  const { projectId } = await searchParams

  return <CreateInvoiceForm initialProjectId={projectId} />
}

export default NewInvoicePage
