// Service instances with dependency injection
import { ContactService } from './ContactService'
import { FileService } from './FileService'
import { ProjectRequestService } from './ProjectRequestService'
import { ProjectService } from './ProjectService'
import { UserService } from './UserService'

// Create services with their dependencies
export const fileService = new FileService()
export const projectService = new ProjectService(fileService)
export const userService = new UserService()
export const projectRequestService = new ProjectRequestService()
export const contactService = new ContactService()

// Export types for dependency injection
export type {
  ContactService,
  FileService,
  ProjectRequestService,
  ProjectService,
  UserService,
}
