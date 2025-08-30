// Service locator - single instances of all services
import { ContactService } from './ContactService'
import { FileService } from './FileService'
import { ProjectRequestService } from './ProjectRequestService'
import { ProjectService } from './ProjectService'
import { UserService } from './UserService'

export const services = {
  contactService: new ContactService(),
  fileService: new FileService(),
  projectRequestService: new ProjectRequestService(),
  projectService: new ProjectService(),
  userService: new UserService(),
}
