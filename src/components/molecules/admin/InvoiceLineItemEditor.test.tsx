import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { LineItemDraft } from './InvoiceLineItemEditor'

import { InvoiceLineItemEditor } from './InvoiceLineItemEditor'

const items: LineItemDraft[] = [
  { key: 'a', description: 'First', quantity: 1, unitPrice: 100 },
  { key: 'b', description: 'Second', quantity: 2, unitPrice: 50 },
]

const keysOf = (call: LineItemDraft[] | undefined): string[] | undefined =>
  call?.map(({ key }) => key)

describe('InvoiceLineItemEditor', () => {
  it('edits a price', () => {
    const onChange = vi.fn<(items: LineItemDraft[]) => void>()
    render(<InvoiceLineItemEditor items={items} onChangeAction={onChange} />)

    fireEvent.change(screen.getByLabelText('Unit price 1'), {
      target: { value: '250' },
    })

    expect(onChange.mock.calls[0]?.[0][0]).toMatchObject({ unitPrice: 250 })
  })

  it('removes and reorders items', () => {
    const onChange = vi.fn<(items: LineItemDraft[]) => void>()
    render(<InvoiceLineItemEditor items={items} onChangeAction={onChange} />)

    fireEvent.click(screen.getByLabelText('Remove item 1'))

    expect(keysOf(onChange.mock.calls[0]?.[0])).toEqual(['b'])

    fireEvent.click(screen.getByLabelText('Move item 1 down'))

    expect(keysOf(onChange.mock.calls[1]?.[0])).toEqual(['b', 'a'])
  })

  it('adds a custom item', () => {
    const onChange = vi.fn<(items: LineItemDraft[]) => void>()
    render(<InvoiceLineItemEditor items={items} onChangeAction={onChange} />)

    fireEvent.click(screen.getByText('+ ADD CUSTOM ITEM'))

    expect(onChange.mock.calls[0]?.[0]).toHaveLength(3)
  })
})
