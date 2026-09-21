import { ProjectFeature } from '@/graphql/schema'

import { getFeatureLabel } from './featureLabels'

export type FeaturePricing = {
  label: string
  defaultPrice: number
  description: string
}

/**
 * Internal reference data for auto-populating invoice line items (InvoiceService, Phase 3).
 * Default prices are midpoints of the market-research ranges in docs/INVOICE_BILLING_EPIC.md,
 * rounded to the nearest $25. Never expose these to clients - only the admin-set per-invoice
 * price is client-facing. Label/description text lives in featureLabels.ts, which is safe to
 * share with client-facing code; only defaultPrice is admin-only.
 */
export const featurePricing: Record<ProjectFeature, FeaturePricing> = {
  [ProjectFeature.Database]: {
    ...getFeatureLabel(ProjectFeature.Database),
    defaultPrice: 550,
  },
  [ProjectFeature.Auth]: {
    ...getFeatureLabel(ProjectFeature.Auth),
    defaultPrice: 350,
  },
  [ProjectFeature.Email]: {
    ...getFeatureLabel(ProjectFeature.Email),
    defaultPrice: 225,
  },
  [ProjectFeature.ResponsiveDesign]: {
    ...getFeatureLabel(ProjectFeature.ResponsiveDesign),
    defaultPrice: 350,
  },
  [ProjectFeature.CustomDesign]: {
    ...getFeatureLabel(ProjectFeature.CustomDesign),
    defaultPrice: 1900,
  },
  [ProjectFeature.PaymentProcessing]: {
    ...getFeatureLabel(ProjectFeature.PaymentProcessing),
    defaultPrice: 550,
  },
  [ProjectFeature.EcommercePlatformIntegration]: {
    ...getFeatureLabel(ProjectFeature.EcommercePlatformIntegration),
    defaultPrice: 1900,
  },
  [ProjectFeature.CmsIntegration]: {
    ...getFeatureLabel(ProjectFeature.CmsIntegration),
    defaultPrice: 550,
  },
  [ProjectFeature.ContentCreation]: {
    ...getFeatureLabel(ProjectFeature.ContentCreation),
    defaultPrice: 950,
  },
  [ProjectFeature.Seo]: {
    ...getFeatureLabel(ProjectFeature.Seo),
    defaultPrice: 350,
  },
  [ProjectFeature.Analytics]: {
    ...getFeatureLabel(ProjectFeature.Analytics),
    defaultPrice: 225,
  },
  [ProjectFeature.Deployment]: {
    ...getFeatureLabel(ProjectFeature.Deployment),
    defaultPrice: 250,
  },
  [ProjectFeature.DomainConfig]: {
    ...getFeatureLabel(ProjectFeature.DomainConfig),
    defaultPrice: 150,
  },
  [ProjectFeature.AdminDashboard]: {
    ...getFeatureLabel(ProjectFeature.AdminDashboard),
    defaultPrice: 1000,
  },
  [ProjectFeature.CustomApi]: {
    ...getFeatureLabel(ProjectFeature.CustomApi),
    defaultPrice: 400,
  },
  [ProjectFeature.FileUploads]: {
    ...getFeatureLabel(ProjectFeature.FileUploads),
    defaultPrice: 350,
  },
  [ProjectFeature.QaLaunchTesting]: {
    ...getFeatureLabel(ProjectFeature.QaLaunchTesting),
    defaultPrice: 425,
  },
  [ProjectFeature.MaintenanceRetainer]: {
    ...getFeatureLabel(ProjectFeature.MaintenanceRetainer),
    defaultPrice: 275,
  },
  [ProjectFeature.TechnicalAdvisory]: {
    ...getFeatureLabel(ProjectFeature.TechnicalAdvisory),
    defaultPrice: 450,
  },
}
