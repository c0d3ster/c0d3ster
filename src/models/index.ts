// Re-export for convenience
import { domains } from './domains'
import { projectFiles } from './files'
import {
  projectCollaborators,
  projectRequests,
  projects,
  projectStatusUpdates,
} from './projects'
import { users } from './users'

export * from './domains'

// Export all enums
export * from './enums'
export * from './files'
export * from './projects'
// Export all tables
export * from './users'

export const schemas = {
  users,
  projectRequests,
  projects,
  projectStatusUpdates,
  projectFiles,
  domains,
  projectCollaborators,
}
