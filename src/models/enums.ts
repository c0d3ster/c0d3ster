import { pgEnum } from 'drizzle-orm/pg-core'

// Project-related enums
export const projectStatusEnum = pgEnum('project_status', [
  'requested',
  'in_review',
  'approved',
  'in_progress',
  'in_testing',
  'ready_for_launch',
  'live',
  'completed',
  'on_hold',
  'cancelled',
])

export const projectPriorityEnum = pgEnum('project_priority', [
  'low',
  'medium',
  'high',
  'urgent',
])

export const projectTypeEnum = pgEnum('project_type', [
  'website',
  'web_app',
  'mobile_app',
  'e_commerce',
  'api',
  'maintenance',
  'consultation',
  'other',
])

// Domain-related enums
export const domainStatusEnum = pgEnum('domain_status', [
  'pending',
  'active',
  'expired',
  'transferred',
  'cancelled',
])

// File-related enums
export const fileTypeEnum = pgEnum('file_type', [
  'design',
  'document',
  'image',
  'video',
  'code',
  'other',
])

// User role enums
export const userRoleEnum = pgEnum('user_role', [
  'client',
  'developer',
  'admin',
  'super_admin',
])
