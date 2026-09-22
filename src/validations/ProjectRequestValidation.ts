import z from 'zod'

import { ProjectFeature, ProjectType } from '@/graphql/generated/graphql'
import { getFeatureLabel } from '@/libs/featureLabels'

// Project request form validation schema
export const projectRequestSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(255, 'Project name too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description too long'),
  projectType: z.nativeEnum(ProjectType, {
    message: 'Please select a project type',
  }),
  budget: z
    .string()
    .optional()
    .refine((val) => !val || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Budget must be a non-negative number',
    }),
  timeline: z.string().max(100, 'Timeline too long').optional(),
  contactPreference: z
    .enum(['email', 'phone', 'video_call', 'in_person'], {
      message: 'Please select a contact preference',
    })
    .optional(),
  additionalInfo: z.string().max(1000, 'Additional info too long').optional(),
  features: z.array(z.nativeEnum(ProjectFeature)).optional(),
})

// Infer the TypeScript type from the schema
export type ProjectRequestData = z.infer<typeof projectRequestSchema>

// Project type options for the form - automatically generated from enum
export const projectTypeOptions = Object.values(ProjectType).map((value) => ({
  value,
  label: value
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters (for camelCase)
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim(), // Remove leading/trailing spaces
}))

// Expected output:
// website -> "Website"
// web_app -> "Web App"
// mobile_app -> "Mobile App"
// e_commerce -> "E Commerce"
// api -> "Api"
// maintenance -> "Maintenance"
// consultation -> "Consultation"
// other -> "Other"

// Feature options for the feature checklist - labels only, no pricing (pricing is
// admin-only reference data in src/libs/featurePricing.ts). Labels come from the same
// featureLabels.ts map featurePricing.ts uses, so the client-facing checklist and the
// admin invoice line items always describe a feature the same way.
export const projectFeatureOptions = Object.values(ProjectFeature).map((value) => ({
  value,
  label: getFeatureLabel(value).label,
}))

// Contact preference options
export const contactPreferenceOptions = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'video_call', label: 'Video Call' },
  { value: 'in_person', label: 'In Person' },
] as const

/**
 * Client-side mirror of src/libs/projectTypeFeatures.ts, kept separate because the
 * generated client ProjectFeature/ProjectType enums are a distinct type from the
 * server-side schema enums (same members, incompatible TS types) - this drives the
 * request form's feature prefill, the server-side map drives approval fallback logic.
 */
const DEFAULT_FEATURES_BY_PROJECT_TYPE: Record<ProjectType, ProjectFeature[]> = {
  [ProjectType.Website]: [ProjectFeature.Email, ProjectFeature.ResponsiveDesign],
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
    ProjectFeature.CustomDesign,
  ],
  [ProjectType.Api]: [ProjectFeature.Database, ProjectFeature.CustomApi],
  [ProjectType.Maintenance]: [ProjectFeature.MaintenanceRetainer],
  [ProjectType.Consultation]: [ProjectFeature.TechnicalAdvisory],
  [ProjectType.Other]: [],
}

export const getDefaultFeaturesForProjectType = (
  projectType: ProjectType
): ProjectFeature[] => DEFAULT_FEATURES_BY_PROJECT_TYPE[projectType]

// Client-facing description of what each project type means, shown in the request
// form directly below the Project Type select.
export const projectTypeDescriptions: Record<ProjectType, string> = {
  [ProjectType.Website]:
    'A landing page or informational site describing your business: a homepage, maybe an About or Services page, and a way for visitors to reach you. No logins or user accounts.',
  [ProjectType.WebApp]:
    'A fully functional application where users create accounts and interact with your data - dashboards, member portals, or booking tools.',
  [ProjectType.ECommerce]:
    'An online store where customers browse products, create accounts, and check out.',
  [ProjectType.MobileApp]:
    'A native or cross-platform iOS/Android app, typically with accounts and data that syncs across devices.',
  [ProjectType.Api]:
    'A backend-only service that your own app or someone else\'s calls into - no user-facing screens are part of this.',
  [ProjectType.Maintenance]:
    'Ongoing upkeep on something already built (by me or someone else) - bug fixes, updates, and support, not a new build.',
  [ProjectType.Consultation]:
    'A paid advisory engagement - architecture review, technical planning, or scoping help - with no build deliverable.',
  [ProjectType.Other]:
    'Doesn\'t fit the above - describe what you need and we\'ll pick the right features together.',
}

// Groups the advanced-options feature checklist into labeled sections for readability.
export const projectFeatureGroups: { label: string; features: ProjectFeature[] }[] = [
  {
    label: 'Core Build',
    features: [
      ProjectFeature.Database,
      ProjectFeature.Auth,
      ProjectFeature.Email,
      ProjectFeature.ResponsiveDesign,
      ProjectFeature.CustomDesign,
    ],
  },
  {
    label: 'Commerce',
    features: [
      ProjectFeature.PaymentProcessing,
      ProjectFeature.EcommercePlatformIntegration,
    ],
  },
  {
    label: 'Content & Discovery',
    features: [
      ProjectFeature.CmsIntegration,
      ProjectFeature.ContentCreation,
      ProjectFeature.Seo,
      ProjectFeature.Analytics,
    ],
  },
  {
    label: 'Infrastructure',
    features: [
      ProjectFeature.Deployment,
      ProjectFeature.DomainConfig,
      ProjectFeature.AdminDashboard,
      ProjectFeature.CustomApi,
      ProjectFeature.FileUploads,
    ],
  },
  {
    label: 'Quality & Ongoing',
    features: [
      ProjectFeature.QaLaunchTesting,
      ProjectFeature.MaintenanceRetainer,
      ProjectFeature.TechnicalAdvisory,
    ],
  },
]
