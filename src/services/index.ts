// Service instances with dependency injection
import { ContactService } from './ContactService'
import { FileService } from './FileService'
import { InvoiceService } from './InvoiceService'
import { ProjectInferenceService } from './ProjectInferenceService'
import { ProjectRequestService } from './ProjectRequestService'
import { ProjectService } from './ProjectService'
import { UserService } from './UserService'

export * from './GitHubService'
export type { InvoiceDetail } from './InvoiceService'

// Create services with their dependencies
export const fileService = new FileService()
export const projectService = new ProjectService(fileService)
export const userService = new UserService()
export const projectRequestService = new ProjectRequestService()
export const contactService = new ContactService()
export const projectInferenceService = new ProjectInferenceService()
export const invoiceService = new InvoiceService()

// Export types for dependency injection
export type {
  ContactService,
  FileService,
  InvoiceService,
  ProjectInferenceService,
  ProjectRequestService,
  ProjectService,
  UserService,
}
