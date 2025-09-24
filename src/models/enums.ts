import { pgEnum } from 'drizzle-orm/pg-core'

import {
  ProjectPriority,
  ProjectStatus,
  ProjectType,
  UserRole,
} from '@/graphql/schema'

// Project-related enums - derived from GraphQL schema
export const projectStatusEnum = pgEnum(
  'project_status',
  Object.values(ProjectStatus) as [string, ...string[]]
)
export const projectPriorityEnum = pgEnum(
  'project_priority',
  Object.values(ProjectPriority) as [string, ...string[]]
)
export const projectTypeEnum = pgEnum(
  'project_type',
  Object.values(ProjectType) as [string, ...string[]]
)

// Domain-related enums
export const domainStatusEnum = pgEnum('domain_status', [
  'pending',
  'active',
  'expired',
  'transferred',
  'cancelled',
])

// User role enums - derived from GraphQL schema
export const userRoleEnum = pgEnum(
  'user_role',
  Object.values(UserRole) as [string, ...string[]]
)
