'use client'

import { useGetMe } from '@/apiClients/userApiClient'
import { isAdminRole } from '@/utils/RoleConstants'

import { AdminInvoiceDetail } from '../admin/AdminInvoiceDetail'
import { AdminInvoiceList } from '../admin/AdminInvoiceList'
import { InvoiceDetail } from './InvoiceDetail'
import { InvoiceList } from './InvoiceList'

const LoadingState = (): React.ReactElement => (
  <div className='py-20 text-center font-mono text-green-400/60'>
    Loading...
  </div>
)

// Admins manage every invoice, clients see their own
export const RoleInvoiceList = (): React.ReactElement => {
  const { data, loading } = useGetMe()
  if (loading && !data) return <LoadingState />
  return isAdminRole(data?.me?.role) ? <AdminInvoiceList /> : <InvoiceList />
}

export const RoleInvoiceDetail = ({
  id,
}: {
  id: string
}): React.ReactElement => {
  const { data, loading } = useGetMe()
  if (loading && !data) return <LoadingState />
  return isAdminRole(data?.me?.role) ? (
    <AdminInvoiceDetail id={id} />
  ) : (
    <InvoiceDetail id={id} />
  )
}
