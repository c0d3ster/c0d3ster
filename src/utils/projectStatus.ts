import { ProjectStatus } from '@/graphql/schema'

const DB_STATUS_VALUES = new Set(
  Object.values(ProjectStatus) as string[]
)

/**
 * Coerces status strings from clients (e.g. GraphQL codegen using enum keys like
 * "InReview") to the canonical DB / enum values (e.g. "in_review").
 */
export function normalizeProjectStatusInput(status: string): ProjectStatus {
  if (DB_STATUS_VALUES.has(status)) {
    return status as ProjectStatus
  }
  const fromKey = ProjectStatus[status as keyof typeof ProjectStatus]
  if (typeof fromKey === 'string' && DB_STATUS_VALUES.has(fromKey)) {
    return fromKey as ProjectStatus
  }
  throw new Error(`Invalid project status: ${status}`)
}
