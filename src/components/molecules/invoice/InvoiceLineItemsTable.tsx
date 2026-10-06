import { formatCurrency } from '@/utils/Invoice'

type InvoiceLineItemsTableProps = {
  lineItems: ReadonlyArray<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
    sortOrder: number
  }>
}

export const InvoiceLineItemsTable = ({
  lineItems,
}: InvoiceLineItemsTableProps): React.ReactElement => {
  const sorted = [...lineItems].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <table className='w-full font-mono text-sm text-green-300'>
      <thead>
        <tr className='border-b border-green-400/20 text-left text-xs text-green-300/60 uppercase'>
          <th className='py-2 pr-2'>Description</th>
          <th className='p-2 text-right'>Qty</th>
          <th className='p-2 text-right'>Unit price</th>
          <th className='py-2 pl-2 text-right'>Total</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((item) => (
          <tr key={item.id} className='border-b border-green-400/10'>
            <td className='py-2 pr-2'>{item.description}</td>
            <td className='p-2 text-right'>{item.quantity}</td>
            <td className='p-2 text-right'>
              {formatCurrency(item.unitPrice)}
            </td>
            <td className='py-2 pl-2 text-right'>
              {formatCurrency(item.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
