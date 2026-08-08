import { ProjectFeature } from '@/graphql/schema'

export type FeaturePricing = {
  label: string
  defaultPrice: number
  description: string
}

/**
 * Internal reference data for auto-populating invoice line items (InvoiceService, Phase 3).
 * Default prices are midpoints of the market-research ranges in docs/INVOICE_BILLING_EPIC.md,
 * rounded to the nearest $25. Never expose these to clients - only the admin-set per-invoice
 * price is client-facing.
 */
export const featurePricing: Record<ProjectFeature, FeaturePricing> = {
  [ProjectFeature.Database]: {
    label: 'Database Design & Setup',
    defaultPrice: 550,
    description: 'Schema design, migrations, and database provisioning',
  },
  [ProjectFeature.Auth]: {
    label: 'Authentication System',
    defaultPrice: 350,
    description: 'User sign-up, sign-in, and session management',
  },
  [ProjectFeature.Email]: {
    label: 'Email Integration',
    defaultPrice: 225,
    description: 'Transactional email delivery setup',
  },
  [ProjectFeature.AdminDashboard]: {
    label: 'Admin Dashboard',
    defaultPrice: 1000,
    description: 'Internal dashboard for managing content and users',
  },
  [ProjectFeature.PaymentProcessing]: {
    label: 'Payment Processing',
    defaultPrice: 550,
    description: 'Stripe checkout and payment handling',
  },
  [ProjectFeature.FileUploads]: {
    label: 'File Upload System',
    defaultPrice: 350,
    description: 'File storage, upload, and retrieval',
  },
  [ProjectFeature.CustomApi]: {
    label: 'Custom API Endpoints',
    defaultPrice: 400,
    description: 'Bespoke API endpoints beyond standard CRUD',
  },
  [ProjectFeature.Deployment]: {
    label: 'Deployment & CI/CD Setup',
    defaultPrice: 250,
    description: 'Automated build and deployment pipeline',
  },
  [ProjectFeature.DomainConfig]: {
    label: 'Domain Configuration',
    defaultPrice: 150,
    description: 'DNS setup and custom domain configuration',
  },
  [ProjectFeature.Seo]: {
    label: 'SEO Setup',
    defaultPrice: 350,
    description: 'Metadata, sitemap, and search engine optimization',
  },
  [ProjectFeature.CmsIntegration]: {
    label: 'CMS Integration',
    defaultPrice: 550,
    description: 'Content management system setup and integration',
  },
  [ProjectFeature.ResponsiveDesign]: {
    label: 'Mobile-Responsive Design',
    defaultPrice: 350,
    description: 'Layouts optimized for mobile and tablet devices',
  },
  [ProjectFeature.ThirdPartyIntegrations]: {
    label: 'Third-Party Integrations',
    defaultPrice: 400,
    description: 'Integration with external services and APIs',
  },
  [ProjectFeature.Analytics]: {
    label: 'Analytics Setup',
    defaultPrice: 225,
    description: 'Usage tracking and analytics dashboards',
  },
  [ProjectFeature.Testing]: {
    label: 'Testing & QA',
    defaultPrice: 350,
    description: 'Automated test coverage and quality assurance',
  },
  [ProjectFeature.Consultation]: {
    label: 'Consultation',
    defaultPrice: 275,
    description: 'Technical consultation and planning',
  },
  [ProjectFeature.ProjectManagement]: {
    label: 'Project Management',
    defaultPrice: 275,
    description: 'Ongoing project coordination and management',
  },
}
