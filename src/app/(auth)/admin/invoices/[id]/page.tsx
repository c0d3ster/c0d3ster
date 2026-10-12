import type { Metadata } from 'next'

import { AdminInvoiceDetail } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Invoice - ${BRAND_NAME}`,
}

type PageProps = {
  params: Promise<{ id: string }>
}

const AdminInvoicePage = async ({ params }: PageProps) => {
  const { id } = await params

  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <AdminInvoiceDetail id={id} />
      </div>
    </CleanPageTemplate>
  )
}

export default AdminInvoicePage
