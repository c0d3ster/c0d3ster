import {
  boolean,
  decimal,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  unique,
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
export const projectRequests = pgTable(
  'project_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectName: varchar('project_name', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }),
    description: text('description').notNull(),
    projectType: projectTypeEnum('project_type').notNull(),
    budget: decimal('budget', { precision: 10, scale: 2, mode: 'number' }),
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
  },
  (table) => ({
    userIdIdx: index('idx_project_requests_user_id').on(table.userId),
    reviewedByIdx: index('idx_project_requests_reviewed_by').on(
      table.reviewedBy
    ),
  })
)

// Projects - approved and active projects
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id').references(() => projectRequests.id),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    developerId: uuid('developer_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    projectName: varchar('project_name', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }),
    description: text('description').notNull(),
    overview: text('overview'),
    logo: text('logo'),
    projectType: projectTypeEnum('project_type').notNull(),
    status: projectStatusEnum('status').notNull().default('approved'),
    priority: projectPriorityEnum('priority').notNull().default('medium'),
    budget: decimal('budget', { precision: 10, scale: 2, mode: 'number' }),
    paidAmount: decimal('paid_amount', {
      precision: 10,
      scale: 2,
      mode: 'number',
    }).default(0),
    startDate: timestamp('start_date'),
    estimatedCompletionDate: timestamp('estimated_completion_date'),
    actualCompletionDate: timestamp('actual_completion_date'),
    requirements: json('requirements'),
    techStack: json('tech_stack').$type<string[]>(), // Array of technologies
    repositoryUrl: text('repository_url'),
    stagingUrl: text('staging_url'),
    liveUrl: text('live_url'),
    clientNotes: text('client_notes'),
    internalNotes: text('internal_notes'),
    progressPercentage: integer('progress_percentage').default(0),
    featured: boolean('featured').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    requestIdIdx: index('idx_projects_request_id').on(table.requestId),
    clientIdIdx: index('idx_projects_client_id').on(table.clientId),
    developerIdIdx: index('idx_projects_developer_id').on(table.developerId),
  })
)

// Status updates for both projects and project requests
export const statusUpdates = pgTable(
  'status_updates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 20 }).notNull(), // 'project' or 'project_request'
    entityId: uuid('entity_id').notNull(), // references either projects.id or project_requests.id
    oldStatus: projectStatusEnum('old_status'),
    newStatus: projectStatusEnum('new_status').notNull(),
    progressPercentage: integer('progress_percentage'),
    updateMessage: text('update_message').notNull(),
    isClientVisible: boolean('is_client_visible').default(true),
    updatedBy: uuid('updated_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    entityTypeIdIdx: index('idx_status_updates_entity_type_id').on(
      table.entityType,
      table.entityId
    ),
    updatedByIdx: index('idx_status_updates_updated_by').on(table.updatedBy),
  })
)

// Project collaborators (for team access)
export const projectCollaborators = pgTable(
  'project_collaborators',
  {
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
  },
  (table) => ({
    projectIdIdx: index('idx_project_collab_project_id').on(table.projectId),
    userIdIdx: index('idx_project_collab_user_id').on(table.userId),
    addedByIdx: index('idx_project_collab_added_by').on(table.addedBy),
    projectUserUnique: unique('uq_project_collaborator').on(
      table.projectId,
      table.userId
    ),
  })
)

// Type exports for use in services and resolvers
export type ProjectRecord = typeof projects.$inferSelect
export type ProjectRequestRecord = typeof projectRequests.$inferSelect
export type StatusUpdateRecord = typeof statusUpdates.$inferSelect
export type ProjectCollaboratorRecord = typeof projectCollaborators.$inferSelect
