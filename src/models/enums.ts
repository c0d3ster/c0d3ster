import { pgEnum } from 'drizzle-orm/pg-core'

import {
  ProjectPriority,
  ProjectStatus,
  ProjectType,
  UserRole,
} from '@/graphql/schema'

// Project-related enums - derived from GraphQL schema
export const projectStatusEnum = pgEnum('project_status', ProjectStatus)
export const projectPriorityEnum = pgEnum('project_priority', ProjectPriority)
export const projectTypeEnum = pgEnum('project_type', ProjectType)

// Domain-related enums
export const domainStatusEnum = pgEnum('domain_status', [
  'pending',
  'active',
  'expired',
  'transferred',
  'cancelled',
])

// User role enums - derived from GraphQL schema
export const userRoleEnum = pgEnum('user_role', UserRole)
