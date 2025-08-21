// Project and request types
export enum ProjectItemType {
  REQUEST = 'request',
  PROJECT = 'project',
}

export type ProjectRequest = {
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

export type Project = {
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
  createdAt: string
  updatedAt: string
  type: ProjectItemType.PROJECT
  userRole?: string
}

export type ProjectItem = ProjectRequest | Project
