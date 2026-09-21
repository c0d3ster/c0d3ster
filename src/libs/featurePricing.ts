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
  [ProjectFeature.ResponsiveDesign]: {
    label: 'Mobile-Responsive Design',
    defaultPrice: 350,
    description: 'Layouts optimized for mobile and tablet devices',
  },
  [ProjectFeature.CustomDesign]: {
    label: 'Custom UI/UX Design & Branding',
    defaultPrice: 1900,
    description:
      'Custom visual design and brand identity for clients without existing design assets',
  },
  [ProjectFeature.PaymentProcessing]: {
    label: 'Payment Processing',
    defaultPrice: 550,
    description: 'Stripe checkout and payment handling',
  },
  [ProjectFeature.EcommercePlatformIntegration]: {
    label: 'E-Commerce Platform Integration',
    defaultPrice: 1900,
    description:
      'Shopify/WooCommerce setup, inventory sync, and product catalog management',
  },
  [ProjectFeature.CmsIntegration]: {
    label: 'CMS Integration',
    defaultPrice: 550,
    description: 'Content management system setup and integration',
  },
  [ProjectFeature.ContentCreation]: {
    label: 'Content Writing & Population',
    defaultPrice: 950,
    description:
      'Copywriting and content population for site pages, distinct from CMS setup itself',
  },
  [ProjectFeature.Seo]: {
    label: 'SEO Setup',
    defaultPrice: 350,
    description: 'Metadata, sitemap, and search engine optimization',
  },
  [ProjectFeature.Analytics]: {
    label: 'Analytics Setup',
    defaultPrice: 225,
    description: 'Usage tracking and analytics dashboards',
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
  [ProjectFeature.AdminDashboard]: {
    label: 'Admin Dashboard',
    defaultPrice: 1000,
    description: 'Internal dashboard for managing content and users',
  },
  [ProjectFeature.CustomApi]: {
    label: 'Custom API Endpoints',
    defaultPrice: 400,
    description:
      'Public or partner-facing API endpoints for external consumption (a companion mobile app, third-party integrations, partner access) - not billed for a web app\'s own internal backend, which is part of the base build',
  },
  [ProjectFeature.FileUploads]: {
    label: 'File Upload System',
    defaultPrice: 350,
    description: 'File storage, upload, and retrieval',
  },
  [ProjectFeature.QaLaunchTesting]: {
    label: 'QA & Launch Testing',
    defaultPrice: 425,
    description:
      'Manual cross-browser/device testing and user acceptance testing before launch (automated test coverage is included in base development, not billed separately)',
  },
  [ProjectFeature.MaintenanceRetainer]: {
    label: 'Ongoing Maintenance & Support',
    defaultPrice: 275,
    description: 'Monthly retainer covering updates, bug fixes, and support after launch',
  },
  [ProjectFeature.TechnicalAdvisory]: {
    label: 'Technical Advisory',
    defaultPrice: 450,
    description: 'Technical consultation and planning session',
  },
}
