'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { GetInvoiceQuery } from '@/graphql/generated/graphql'

import {
  useCreateInvoice,
  useGetProjects,
  useSendInvoice,
  useSuggestedInvoiceLineItems,
  useUpdateInvoice,
} from '@/apiClients'
import { DiscountType, InvoiceStatus } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'
import {
  calculatePreviewTotals,
  formatCurrency,
  newLineItemKey,
} from '@/utils/Invoice'

import type { LineItemDraft } from './InvoiceLineItemEditor'

import { InvoiceLineItemEditor } from './InvoiceLineItemEditor'

type ExistingInvoice = NonNullable<GetInvoiceQuery['getInvoice']>

type CreateInvoiceFormProps = {
  // When set, edits this invoice instead of creating one (the project is fixed)
  invoice?: ExistingInvoice
}

type Step = 'project' | 'items' | 'discount' | 'terms' | 'preview'

type SharedInput = {
  lineItems: {
    feature?: LineItemDraft['feature']
    description: string
    quantity: number
    unitPrice: number
  }[]
  depositPercent: number
  depositDueDate?: string
  balanceDueDate?: string
  notes: string
  paymentInstructions: string
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'project', label: 'Project' },
  { id: 'items', label: 'Line items' },
  { id: 'discount', label: 'Discount' },
  { id: 'terms', label: 'Terms' },
  { id: 'preview', label: 'Preview' },
]

const inputClass =
  'w-full rounded border border-green-400/30 bg-black/60 px-3 py-2 font-mono text-sm text-green-300 focus:border-green-400 focus:outline-none'
const labelClass = 'mb-1 block font-mono text-xs text-green-300/60 uppercase'
const buttonClass =
  'rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm font-bold text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black disabled:opacity-40'

const toDateInput = (value?: string | null): string => value?.slice(0, 10) ?? ''

const toDraft = (
  item: ExistingInvoice['lineItems'][number]
): LineItemDraft => ({
  key: item.id,
  feature: item.feature,
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
})

export const CreateInvoiceForm = ({
  invoice,
}: CreateInvoiceFormProps): React.ReactElement => {
  const router = useRouter()
  const isEdit = Boolean(invoice)
  const [step, setStep] = useState<Step>(isEdit ? 'items' : 'project')
  const [projectId, setProjectId] = useState(invoice?.projectId ?? '')
  const [items, setItems] = useState<LineItemDraft[]>(
    invoice?.lineItems.map(toDraft) ?? []
  )
  const [discountType, setDiscountType] = useState<DiscountType | ''>(
    invoice?.discountType ?? ''
  )
  const [discountValue, setDiscountValue] = useState(
    invoice?.discountValue ?? 0
  )
  const [discountLabel, setDiscountLabel] = useState(
    invoice?.discountLabel ?? ''
  )
  const [depositPercent, setDepositPercent] = useState(
    invoice?.depositPercent ?? 0
  )
  const [depositDueDate, setDepositDueDate] = useState(() =>
    toDateInput(invoice?.depositDueDate)
  )
  const [balanceDueDate, setBalanceDueDate] = useState(() =>
    toDateInput(invoice?.balanceDueDate)
  )
  const [notes, setNotes] = useState(invoice?.notes ?? '')
  const [paymentInstructions, setPaymentInstructions] = useState(
    invoice?.paymentInstructions ?? ''
  )
  const [submitting, setSubmitting] = useState(false)

  const { data: projectsData } = useGetProjects()
  const [loadSuggestions] = useSuggestedInvoiceLineItems()
  const [createInvoice] = useCreateInvoice()
  const [updateInvoice] = useUpdateInvoice()
  const [sendInvoice] = useSendInvoice()

  const projects = projectsData?.projects ?? []
  const stepIndex = STEPS.findIndex(({ id }) => id === step)
  const firstStepIndex = isEdit ? 1 : 0

  // Picking a project pre-fills line items from its features (create only)
  useEffect(() => {
    if (isEdit || !projectId) return
    loadSuggestions({ variables: { projectId } })
      .then(({ data }) =>
        setItems(
          (data?.suggestedInvoiceLineItems ?? []).map((item) => ({
            ...item,
            key: newLineItemKey(),
          }))
        )
      )
      .catch(() => Toast.error('Could not load suggested line items'))
  }, [projectId, isEdit, loadSuggestions])

  const totals = calculatePreviewTotals({
    lineItems: items,
    discountType: discountType || null,
    discountValue,
  })

  const validationError = (): string | null => {
    if (!projectId) return 'Pick a project'
    if (items.length === 0) return 'Add at least one line item'
    if (items.some(({ description }) => !description.trim())) {
      return 'Every line item needs a description'
    }
    if (items.some(({ quantity }) => quantity <= 0)) {
      return 'Quantities must be positive'
    }
    if (depositPercent < 0 || depositPercent > 100) {
      return 'Deposit must be between 0 and 100 percent'
    }
    return null
  }

  const persist = async (shared: SharedInput): Promise<string> => {
    if (invoice) {
      // Explicit nulls clear a previously saved discount
      await updateInvoice({
        variables: {
          id: invoice.id,
          input: {
            ...shared,
            discountType: discountType || null,
            discountValue: discountType ? discountValue : null,
            discountLabel: discountType ? discountLabel : null,
          },
        },
      })
      return invoice.id
    }
    const { data } = await createInvoice({
      variables: {
        input: {
          projectId,
          ...shared,
          ...(discountType && { discountType, discountValue, discountLabel }),
        },
      },
    })
    const id = data?.createInvoice.id
    if (!id) throw new Error('Invoice was not created')
    return id
  }

  const save = async (sendNow: boolean): Promise<void> => {
    const error = validationError()
    if (error) {
      Toast.error(error)
      return
    }

    setSubmitting(true)
    try {
      const id = await persist({
        lineItems: items.map(
          ({ feature, description, quantity, unitPrice }) => ({
            feature,
            description,
            quantity,
            unitPrice,
          })
        ),
        depositPercent,
        depositDueDate: depositDueDate || undefined,
        balanceDueDate: balanceDueDate || undefined,
        notes,
        paymentInstructions,
      })
      if (sendNow) await sendInvoice({ variables: { id } })
      Toast.success(sendNow ? 'Invoice sent' : 'Invoice saved')
      router.push(`/admin/invoices/${id}`)
    } catch (err) {
      Toast.error('Failed to save invoice')
      console.error('Save invoice error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <ol className='flex flex-wrap gap-2'>
        {STEPS.slice(firstStepIndex).map(({ id, label }) => (
          <li
            key={id}
            className={`rounded border px-3 py-1 font-mono text-xs font-bold ${
              id === step
                ? 'border-green-400 bg-green-400 text-black'
                : 'border-green-400/30 text-green-400'
            }`}
          >
            {label.toUpperCase()}
          </li>
        ))}
      </ol>

      {step === 'project' && (
        <div>
          <label htmlFor='invoice-project' className={labelClass}>
            Project
          </label>
          <select
            id='invoice-project'
            className={inputClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value=''>Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title ?? project.projectName}
              </option>
            ))}
          </select>
          <p className='mt-2 font-mono text-xs text-green-300/60'>
            The client and line items come from the project.
          </p>
        </div>
      )}

      {step === 'items' && (
        <InvoiceLineItemEditor items={items} onChangeAction={setItems} />
      )}

      {step === 'discount' && (
        <div className='space-y-3'>
          <div>
            <label htmlFor='discount-type' className={labelClass}>
              Discount
            </label>
            <select
              id='discount-type'
              className={inputClass}
              value={discountType}
              onChange={(e) =>
                setDiscountType(
                  Object.values(DiscountType).find(
                    (type) => type === e.target.value
                  ) ?? ''
                )
              }
            >
              <option value=''>None</option>
              <option value={DiscountType.Percentage}>Percentage</option>
              <option value={DiscountType.Flat}>Flat amount</option>
            </select>
          </div>
          {discountType && (
            <>
              <div>
                <label htmlFor='discount-value' className={labelClass}>
                  {discountType === DiscountType.Percentage
                    ? 'Percent off'
                    : 'Amount off'}
                </label>
                <input
                  id='discount-value'
                  type='number'
                  min='0'
                  step='any'
                  className={inputClass}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor='discount-label' className={labelClass}>
                  Label
                </label>
                <input
                  id='discount-label'
                  className={inputClass}
                  placeholder='Friends & Family Discount'
                  value={discountLabel}
                  onChange={(e) => setDiscountLabel(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {step === 'terms' && (
        <div className='space-y-3'>
          <div>
            <label htmlFor='deposit-percent' className={labelClass}>
              Deposit percent
            </label>
            <input
              id='deposit-percent'
              type='number'
              min='0'
              max='100'
              step='1'
              className={inputClass}
              value={depositPercent}
              onChange={(e) => setDepositPercent(Number(e.target.value))}
            />
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div>
              <label htmlFor='deposit-due' className={labelClass}>
                Deposit due date
              </label>
              <input
                id='deposit-due'
                type='date'
                className={inputClass}
                value={depositDueDate}
                onChange={(e) => setDepositDueDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor='balance-due' className={labelClass}>
                Balance due date
              </label>
              <input
                id='balance-due'
                type='date'
                className={inputClass}
                value={balanceDueDate}
                onChange={(e) => setBalanceDueDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor='invoice-notes' className={labelClass}>
              Notes
            </label>
            <textarea
              id='invoice-notes'
              rows={3}
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='payment-instructions' className={labelClass}>
              Payment instructions
            </label>
            <textarea
              id='payment-instructions'
              rows={3}
              className={inputClass}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className='space-y-4 rounded-lg border border-green-400/20 bg-black/60 p-4 font-mono text-sm text-green-300'>
          <table className='w-full'>
            <tbody>
              {items.map((item) => (
                <tr key={item.key} className='border-b border-green-400/10'>
                  <td className='py-2'>{item.description}</td>
                  <td className='p-2 text-right'>{item.quantity}</td>
                  <td className='py-2 text-right'>
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='space-y-1 text-right'>
            <p>Subtotal: {formatCurrency(totals.subtotal)}</p>
            {totals.discount > 0 && (
              <p>
                {discountLabel || 'Discount'}: -
                {formatCurrency(totals.discount)}
              </p>
            )}
            <p className='font-bold text-green-400'>
              Total: {formatCurrency(totals.total)}
            </p>
            {depositPercent > 0 && (
              <p className='text-green-300/60'>
                Deposit ({depositPercent}%):{' '}
                {formatCurrency((totals.total * depositPercent) / 100)}
              </p>
            )}
          </div>
          {notes && <p className='text-green-300/80'>{notes}</p>}
        </div>
      )}

      <div className='flex flex-wrap justify-between gap-2'>
        <button
          type='button'
          className={buttonClass}
          disabled={stepIndex <= firstStepIndex}
          onClick={() => setStep(STEPS[stepIndex - 1]?.id ?? step)}
        >
          BACK
        </button>
        {step === 'preview' ? (
          <div className='flex gap-2'>
            <button
              type='button'
              className={buttonClass}
              disabled={submitting}
              onClick={() => save(false)}
            >
              SAVE DRAFT
            </button>
            {(!invoice || invoice.status === InvoiceStatus.Draft) && (
              <button
                type='button'
                className={buttonClass}
                disabled={submitting}
                onClick={() => save(true)}
              >
                SAVE & SEND
              </button>
            )}
          </div>
        ) : (
          <button
            type='button'
            className={buttonClass}
            disabled={step === 'project' && !projectId}
            onClick={() => setStep(STEPS[stepIndex + 1]?.id ?? step)}
          >
            NEXT
          </button>
        )}
      </div>
    </div>
  )
}
