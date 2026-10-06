import {
  date,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import type { ProjectFeature } from '@/graphql/schema'

import { InvoiceStatus } from '@/graphql/schema'

import { discountTypeEnum, invoiceStatusEnum } from './enums'
import { projects } from './projects'
import { users } from './users'

const money = (name: string) =>
  decimal(name, { precision: 10, scale: 2, mode: 'number' })

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // No cascade: invoices must survive project/client edits and removals
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    status: invoiceStatusEnum('status').notNull().default(InvoiceStatus.Draft),
    depositPercent: integer('deposit_percent'),
    depositDueDate: date('deposit_due_date', { mode: 'date' }),
    balanceDueDate: date('balance_due_date', { mode: 'date' }),
    subtotal: money('subtotal').notNull().default(0),
    discountType: discountTypeEnum('discount_type'),
    discountValue: money('discount_value'),
    discountLabel: text('discount_label'),
    discountAmount: money('discount_amount'),
    taxRate: decimal('tax_rate', { precision: 5, scale: 4, mode: 'number' })
      .notNull()
      .default(0),
    taxAmount: money('tax_amount').notNull().default(0),
    totalAmount: money('total_amount').notNull().default(0),
    paidAmount: money('paid_amount').notNull().default(0),
    notes: text('notes'),
    paymentInstructions: text('payment_instructions'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeCheckoutSessionId: text('stripe_checkout_session_id'),
    sentAt: timestamp('sent_at'),
    viewedAt: timestamp('viewed_at'),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    projectIdIdx: index('idx_invoices_project_id').on(table.projectId),
    clientIdIdx: index('idx_invoices_client_id').on(table.clientId),
    invoiceNumberUnique: unique('uq_invoices_invoice_number').on(
      table.invoiceNumber
    ),
  })
)

export const invoiceLineItems = pgTable(
  'invoice_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    // null = custom line item
    feature: varchar('feature', { length: 50 }).$type<ProjectFeature>(),
    description: text('description').notNull(),
    quantity: decimal('quantity', {
      precision: 10,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(1),
    unitPrice: money('unit_price').notNull(),
    total: money('total').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    invoiceIdIdx: index('idx_invoice_line_items_invoice_id').on(
      table.invoiceId
    ),
  })
)

export type InvoiceRecord = typeof invoices.$inferSelect
export type InvoiceLineItemRecord = typeof invoiceLineItems.$inferSelect
