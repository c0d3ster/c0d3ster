// Re-export for convenience
import { domains } from './domains'
import { projectFiles } from './files'
import { invoiceLineItems, invoices } from './invoices'
import {
  projectCollaborators,
  projectRequests,
  projects,
  statusUpdates,
} from './projects'
import { users } from './users'

export * from './domains'

// Export all enums
export * from './enums'
export * from './files'
export * from './invoices'
export * from './projects'
// Export all tables
export * from './users'

export const schemas = {
  users,
  projectRequests,
  projects,
  statusUpdates,
  projectFiles,
  domains,
  projectCollaborators,
  invoices,
  invoiceLineItems,
}
