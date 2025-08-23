export type ProjectRequestWithUser = {
  id: string
  userId: string
  title: string
  description: string
  projectType: string
  budget: string | null
  timeline: string | null
  requirements: any
  contactPreference: string | null
  additionalInfo: string | null
  status: string
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
  userEmail: string
  userFirstName: string | null
  userLastName: string | null
}
