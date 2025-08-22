import {
  boolean,
  decimal,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import {
  projectPriorityEnum,
  projectStatusEnum,
  projectTypeEnum,
} from './enums'
import { users } from './users'

// Project requests - initial client submissions
export const projectRequests = pgTable('project_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  projectType: projectTypeEnum('project_type').notNull(),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  timeline: varchar('timeline', { length: 100 }),
  requirements: json('requirements'), // Structured requirements data
  contactPreference: varchar('contact_preference', { length: 50 }),
  additionalInfo: text('additional_info'),
  status: projectStatusEnum('status').notNull().default('requested'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// Projects - approved and active projects
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => projectRequests.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  developerId: uuid('developer_id').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  projectType: projectTypeEnum('project_type').notNull(),
  status: projectStatusEnum('status').notNull().default('approved'),
  priority: projectPriorityEnum('priority').notNull().default('medium'),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),
  startDate: timestamp('start_date'),
  estimatedCompletionDate: timestamp('estimated_completion_date'),
  actualCompletionDate: timestamp('actual_completion_date'),
  requirements: json('requirements'),
  techStack: json('tech_stack'), // Array of technologies
  repositoryUrl: text('repository_url'),
  stagingUrl: text('staging_url'),
  liveUrl: text('live_url'),
  clientNotes: text('client_notes'),
  internalNotes: text('internal_notes'),
  progressPercentage: integer('progress_percentage').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// Project status updates and progress tracking
export const projectStatusUpdates = pgTable('project_status_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  oldStatus: projectStatusEnum('old_status'),
  newStatus: projectStatusEnum('new_status').notNull(),
  progressPercentage: integer('progress_percentage'),
  updateMessage: text('update_message').notNull(),
  isClientVisible: boolean('is_client_visible').default(true),
  updatedBy: uuid('updated_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Project collaborators (for team access)
export const projectCollaborators = pgTable('project_collaborators', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('viewer'), // viewer, editor, admin
  canViewFiles: boolean('can_view_files').default(true),
  canUploadFiles: boolean('can_upload_files').default(false),
  canManageDomains: boolean('can_manage_domains').default(false),
  addedBy: uuid('added_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
