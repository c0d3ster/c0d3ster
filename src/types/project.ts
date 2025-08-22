// Project and request types
export enum ProjectItemType {
  REQUEST = 'request',
  PROJECT = 'project',
}

type ProjectRequest = {
  id: string
  title: string
  description: string
  projectType: string
  budget: string | null
  timeline: string | null
  status: string
  createdAt: string
  updatedAt: string
  type: ProjectItemType.REQUEST
}

type Project = {
  id: string
  title: string
  description: string
  projectType: string
  budget: string | null
  status: string
  priority: string
  progressPercentage: number | null
  startDate: string | null
  estimatedCompletionDate: string | null
  actualCompletionDate: string | null
  liveUrl: string | null
  stagingUrl: string | null
  repositoryUrl: string | null
  techStack: string[] | null
  createdAt: string
  updatedAt: string
  type: ProjectItemType.PROJECT
  userRole?: string
  // Client information (when user is a collaborator)
  clientEmail?: string
  clientFirstName?: string | null
  clientLastName?: string | null
}

export type ProjectItem = ProjectRequest | Project
