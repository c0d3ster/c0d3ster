import { ProjectFeature, ProjectType } from '@/graphql/schema/project'

const PROJECT_TYPE_FEATURES: Record<ProjectType, ProjectFeature[]> = {
  [ProjectType.Website]: [ProjectFeature.Email],
  [ProjectType.WebApp]: [
    ProjectFeature.Database,
    ProjectFeature.Auth,
    ProjectFeature.Email,
    ProjectFeature.ResponsiveDesign,
  ],
  [ProjectType.ECommerce]: [
    ProjectFeature.Database,
    ProjectFeature.Auth,
    ProjectFeature.Email,
    ProjectFeature.PaymentProcessing,
    ProjectFeature.EcommercePlatformIntegration,
    ProjectFeature.ResponsiveDesign,
  ],
  [ProjectType.MobileApp]: [
    ProjectFeature.Database,
    ProjectFeature.Auth,
    ProjectFeature.Email,
  ],
  [ProjectType.Api]: [ProjectFeature.Database],
  [ProjectType.Maintenance]: [ProjectFeature.MaintenanceRetainer],
  [ProjectType.Consultation]: [ProjectFeature.TechnicalAdvisory],
  [ProjectType.Other]: [],
}

export function getDefaultFeatures(projectType: ProjectType): ProjectFeature[] {
  return PROJECT_TYPE_FEATURES[projectType]
}
