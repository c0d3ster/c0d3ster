import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { fileTypeEnum } from './enums'
import { projects } from './projects'
import { users } from './users'

// Project files and assets
export const projectFiles = pgTable('project_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  fileType: fileTypeEnum('file_type').notNull(),
  fileSize: integer('file_size'), // in bytes
  filePath: text('file_path').notNull(),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  isClientVisible: boolean('is_client_visible').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
