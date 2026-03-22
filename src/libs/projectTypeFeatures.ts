import { ProjectFeature, ProjectType } from '@/graphql/schema/project'

const PROJECT_TYPE_FEATURES: Record<ProjectType, ProjectFeature[]> = {
  [ProjectType.Website]: [ProjectFeature.Email],
  [ProjectType.WebApp]: [
    ProjectFeature.Database,
    ProjectFeature.Auth,
    ProjectFeature.Email,
  ],
  [ProjectType.ECommerce]: [
    ProjectFeature.Database,
    ProjectFeature.Auth,
    ProjectFeature.Email,
  ],
  [ProjectType.MobileApp]: [ProjectFeature.Database, ProjectFeature.Email],
  [ProjectType.Api]: [ProjectFeature.Database],
  [ProjectType.Maintenance]: [],
  [ProjectType.Consultation]: [],
  [ProjectType.Other]: [],
}

export function getDefaultFeatures(projectType: ProjectType): ProjectFeature[] {
  return PROJECT_TYPE_FEATURES[projectType]
}
