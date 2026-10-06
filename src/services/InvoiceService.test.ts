import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DiscountType, InvoiceStatus, ProjectFeature } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { featurePricing } from '@/libs/featurePricing'

import {
  calculateDepositAmount,
  calculateInvoiceTotals,
  InvoiceService,
} from './InvoiceService'

describe('calculateInvoiceTotals', () => {
  const lineItems = [
    { quantity: 1, unitPrice: 500 },
    { quantity: 2, unitPrice: 250.25 },
  ]

  it('sums line items with no discount line when discount is omitted', () => {
    const totals = calculateInvoiceTotals({ lineItems, taxRate: 0 })

    expect(totals.lineTotals).toEqual([500, 500.5])
    expect(totals.subtotal).toBe(1000.5)
    expect(totals.discountAmount).toBeNull()
    expect(totals.taxAmount).toBe(0)
    expect(totals.totalAmount).toBe(1000.5)
  })

  it('applies a percentage discount before tax', () => {
    const totals = calculateInvoiceTotals({
      lineItems: [{ quantity: 1, unitPrice: 1000 }],
      discountType: DiscountType.Percentage,
      discountValue: 10,
      taxRate: 0.08,
    })

    expect(totals.discountAmount).toBe(100)
    expect(totals.taxAmount).toBe(72)
    expect(totals.totalAmount).toBe(972)
  })

  it('applies a flat discount and caps it at the subtotal', () => {
    const base = { lineItems: [{ quantity: 1, unitPrice: 100 }], taxRate: 0 }

    expect(
      calculateInvoiceTotals({
        ...base,
        discountType: DiscountType.Flat,
        discountValue: 30,
      }).totalAmount
    ).toBe(70)
    expect(
      calculateInvoiceTotals({
        ...base,
        discountType: DiscountType.Flat,
        discountValue: 500,
      }).totalAmount
    ).toBe(0)
  })

  it('rejects invalid discount and tax input', () => {
    const base = { lineItems, taxRate: 0 }

    expect(() =>
      calculateInvoiceTotals({ ...base, discountType: DiscountType.Flat })
    ).toThrow('discountValue is required')
    expect(() =>
      calculateInvoiceTotals({
        ...base,
        discountType: DiscountType.Percentage,
        discountValue: 101,
      })
    ).toThrow('cannot exceed 100')
    expect(() => calculateInvoiceTotals({ ...base, taxRate: 8 })).toThrow(
      'taxRate'
    )
  })

  it('computes the deposit from the post-discount total', () => {
    expect(calculateDepositAmount(972, 50)).toBe(486)
    expect(calculateDepositAmount(972, null)).toBe(0)
  })
})

describe('InvoiceService', () => {
  const service = new InvoiceService()
  const mockProject = {
    id: 'project-1',
    clientId: 'client-1',
    features: [ProjectFeature.Database, ProjectFeature.Auth],
  }
  const draftInvoice = {
    id: 'invoice-1',
    projectId: 'project-1',
    clientId: 'client-1',
    invoiceNumber: 'INV-2026-001',
    status: InvoiceStatus.Draft,
    depositPercent: null,
    depositDueDate: null,
    balanceDueDate: null,
    subtotal: 100,
    discountType: null,
    discountValue: null,
    discountLabel: null,
    discountAmount: null,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 100,
    paidAmount: 0,
    notes: null,
    paymentInstructions: null,
  }
  const lineItem = {
    id: 'li-1',
    invoiceId: 'invoice-1',
    feature: null,
    description: 'Custom',
    quantity: 1,
    unitPrice: 100,
    total: 100,
    sortOrder: 0,
  }

  const insertedValues = vi.fn()
  const tx = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as never))
    tx.select.mockReturnValue({
      from: () => ({ where: async () => [{ count: 2 }] }),
    })
    tx.insert.mockImplementation(() => ({
      values: (values: unknown) => {
        insertedValues(values)
        return { returning: async () => [{ id: 'invoice-1' }] }
      },
    }))
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockProject as never
    )
    vi.mocked(db.query.invoices.findFirst).mockResolvedValue(
      draftInvoice as never
    )
    vi.mocked(db.query.invoiceLineItems.findMany).mockResolvedValue([
      lineItem,
    ] as never)
  })

  describe('createInvoice', () => {
    it('auto-populates line items from project features with computed numbers', async () => {
      await service.createInvoice({ projectId: 'project-1' })

      const [invoiceValues, itemValues] = insertedValues.mock.calls.map(
        ([values]) => values
      )
      const year = new Date().getFullYear()
      const databasePrice = featurePricing[ProjectFeature.Database].defaultPrice
      const authPrice = featurePricing[ProjectFeature.Auth].defaultPrice

      expect(invoiceValues.invoiceNumber).toBe(`INV-${year}-003`)
      expect(invoiceValues.clientId).toBe('client-1')
      expect(invoiceValues.discountAmount).toBeNull()
      expect(itemValues).toHaveLength(2)
      expect(itemValues[0].feature).toBe(ProjectFeature.Database)
      expect(itemValues[0].unitPrice).toBe(databasePrice)
      expect(invoiceValues.subtotal).toBe(databasePrice + authPrice)
      expect(invoiceValues.totalAmount).toBe(invoiceValues.subtotal)
    })

    it('uses explicit line items as-is', async () => {
      await service.createInvoice({
        projectId: 'project-1',
        lineItems: [{ description: 'Custom work', unitPrice: 40, quantity: 3 }],
      })

      const [invoiceValues, itemValues] = insertedValues.mock.calls.map(
        ([values]) => values
      )

      expect(itemValues).toHaveLength(1)
      expect(itemValues[0].feature).toBeNull()
      expect(itemValues[0].total).toBe(120)
      expect(invoiceValues.totalAmount).toBe(120)
    })

    it('throws NOT_FOUND for an unknown project', async () => {
      vi.mocked(db.query.projects.findFirst).mockResolvedValue(undefined)

      await expect(
        service.createInvoice({ projectId: 'nope' })
      ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } })
    })

    it('maps a unique violation to CONFLICT', async () => {
      vi.mocked(db.transaction).mockRejectedValue({ cause: { code: '23505' } })

      await expect(
        service.createInvoice({ projectId: 'project-1' })
      ).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
    })
  })

  describe('updateInvoice', () => {
    it('rejects edits to non-editable invoices', async () => {
      vi.mocked(db.query.invoices.findFirst).mockResolvedValue({
        ...draftInvoice,
        status: InvoiceStatus.Paid,
      } as never)

      await expect(
        service.updateInvoice('invoice-1', { notes: 'x' })
      ).rejects.toMatchObject({ extensions: { code: 'INVALID_STATUS' } })
    })

    it('recomputes totals from existing line items when a discount is added', async () => {
      const setValues = vi.fn()
      tx.update.mockReturnValue({
        set: (values: unknown) => {
          setValues(values)
          return { where: async () => undefined }
        },
      })

      await service.updateInvoice('invoice-1', {
        discountType: DiscountType.Percentage,
        discountValue: 10,
        discountLabel: 'Friends & Family',
        taxRate: 0.1,
      })

      expect(setValues).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 100,
          discountAmount: 10,
          taxAmount: 9,
          totalAmount: 99,
          discountLabel: 'Friends & Family',
        })
      )
    })
  })

  describe('sendInvoice', () => {
    it('refuses to send a cancelled invoice', async () => {
      vi.mocked(db.query.invoices.findFirst).mockResolvedValue({
        ...draftInvoice,
        status: InvoiceStatus.Cancelled,
      } as never)

      await expect(service.sendInvoice('invoice-1')).rejects.toMatchObject({
        extensions: { code: 'INVALID_STATUS' },
      })
    })

    it('sets status to sent for a draft', async () => {
      const set = vi.fn().mockReturnValue({ where: async () => undefined })
      vi.mocked(db.update).mockReturnValue({ set } as never)

      await service.sendInvoice('invoice-1')

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({ status: InvoiceStatus.Sent })
      )
    })
  })
})
