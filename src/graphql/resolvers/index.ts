import { mergeResolvers } from '@graphql-tools/merge'

import {
  contactService,
  fileService,
  projectRequestService,
  projectService,
  userService,
} from '@/services'

import { ContactResolver } from './ContactResolver'
import { FileResolver } from './FileResolver'
import { ProjectRequestResolver } from './ProjectRequestResolver'
import { ProjectResolver } from './ProjectResolver'
import { UserResolver } from './UserResolver'

// Create resolver instances with dependency injection
const projectResolver = new ProjectResolver(
  projectService,
  userService,
  fileService
)

const userResolver = new UserResolver(
  userService,
  projectService,
  projectRequestService
)

const projectRequestResolver = new ProjectRequestResolver(
  projectRequestService,
  userService
)

const contactResolver = new ContactResolver(contactService)

const fileResolver = new FileResolver(fileService, projectService, userService)

// Use mergeResolvers with the actual resolver objects
export const resolvers = mergeResolvers([
  userResolver,
  projectResolver,
  projectRequestResolver,
  contactResolver,
  fileResolver,
])
