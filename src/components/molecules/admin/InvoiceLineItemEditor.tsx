'use client'

import type { ProjectFeature } from '@/graphql/generated/graphql'

import { newLineItemKey } from '@/utils/Invoice'

export type LineItemDraft = {
  key: string
  feature?: ProjectFeature | null
  description: string
  quantity: number
  unitPrice: number
}

type InvoiceLineItemEditorProps = {
  items: LineItemDraft[]
  onChangeAction: (items: LineItemDraft[]) => void
}

const inputClass =
  'rounded border border-green-400/30 bg-black/60 px-2 py-1 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
const buttonClass =
  'rounded border border-green-400/30 px-2 py-1 font-mono text-xs text-green-400 hover:bg-green-400 hover:text-black disabled:opacity-30'

export const InvoiceLineItemEditor = ({
  items,
  onChangeAction,
}: InvoiceLineItemEditorProps): React.ReactElement => {
  const update = (index: number, patch: Partial<LineItemDraft>): void =>
    onChangeAction(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )

  const remove = (index: number): void =>
    onChangeAction(items.filter((_, i) => i !== index))

  const move = (index: number, offset: number): void => {
    const target = index + offset
    const moving = items[index]
    const swapped = items[target]
    if (!moving || !swapped) return
    onChangeAction(
      items.map((item, i) => {
        if (i === index) return swapped
        if (i === target) return moving
        return item
      })
    )
  }

  const add = (): void =>
    onChangeAction([
      ...items,
      { key: newLineItemKey(), description: '', quantity: 1, unitPrice: 0 },
    ])

  return (
    <div className='space-y-3'>
      {items.length === 0 && (
        <p className='font-mono text-sm text-green-300/60'>
          No line items yet.
        </p>
      )}
      {items.map((item, index) => (
        <div key={item.key} className='flex flex-wrap items-center gap-2'>
          <input
            aria-label={`Description ${index + 1}`}
            className={`${inputClass} min-w-48 flex-1`}
            value={item.description}
            onChange={(e) => update(index, { description: e.target.value })}
          />
          <input
            aria-label={`Quantity ${index + 1}`}
            type='number'
            min='0'
            step='any'
            className={`${inputClass} w-20`}
            value={item.quantity}
            onChange={(e) =>
              update(index, { quantity: Number(e.target.value) })
            }
          />
          <input
            aria-label={`Unit price ${index + 1}`}
            type='number'
            min='0'
            step='0.01'
            className={`${inputClass} w-28`}
            value={item.unitPrice}
            onChange={(e) =>
              update(index, { unitPrice: Number(e.target.value) })
            }
          />
          <button
            type='button'
            aria-label={`Move item ${index + 1} up`}
            className={buttonClass}
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
            ↑
          </button>
          <button
            type='button'
            aria-label={`Move item ${index + 1} down`}
            className={buttonClass}
            disabled={index === items.length - 1}
            onClick={() => move(index, 1)}
          >
            ↓
          </button>
          <button
            type='button'
            aria-label={`Remove item ${index + 1}`}
            className={buttonClass}
            onClick={() => remove(index)}
          >
            ✕
          </button>
        </div>
      ))}
      <button type='button' className={buttonClass} onClick={add}>
        + ADD CUSTOM ITEM
      </button>
    </div>
  )
}
