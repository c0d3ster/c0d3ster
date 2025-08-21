import {
  boolean,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { domainStatusEnum } from './enums'
import { projects } from './projects'
import { users } from './users'

// Domain management
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  domainName: varchar('domain_name', { length: 255 }).notNull().unique(),
  registrar: varchar('registrar', { length: 100 }).default('godaddy'),
  status: domainStatusEnum('status').notNull().default('pending'),
  registrationDate: timestamp('registration_date'),
  expirationDate: timestamp('expiration_date'),
  autoRenew: boolean('auto_renew').default(true),
  nameservers: json('nameservers'), // Array of nameserver URLs
  dnsRecords: json('dns_records'), // DNS configuration
  godaddyDomainId: text('godaddy_domain_id'), // GoDaddy API reference
  sslCertificate: boolean('ssl_certificate').default(false),
  sslExpirationDate: timestamp('ssl_expiration_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})
