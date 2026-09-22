type FeatureLabel = {
  label: string
  description: string
}

/**
 * Client-safe display copy for each ProjectFeature - shared by the request form's
 * checklist and featurePricing.ts's admin-only pricing map. Keyed by the enum's raw
 * string value (not the enum type itself) so it can be indexed from either the
 * server-side schema enum or the codegen'd client enum, which are structurally
 * distinct TS types despite sharing the same string values.
 */
const featureLabels: Record<string, FeatureLabel> = {
  database: {
    label: 'Database Design & Setup',
    description: 'Schema design, migrations, and database provisioning',
  },
  auth: {
    label: 'Authentication System',
    description: 'User sign-up, sign-in, and session management',
  },
  email: {
    label: 'Email Integration',
    description: 'Transactional email delivery setup',
  },
  responsive_design: {
    label: 'Mobile-Responsive Design',
    description: 'Layouts optimized for mobile and tablet devices',
  },
  custom_design: {
    label: 'Custom UI/UX Design & Branding',
    description:
      'Custom visual design and brand identity for clients without existing design assets',
  },
  payment_processing: {
    label: 'Payment Processing',
    description: 'Stripe checkout and payment handling',
  },
  ecommerce_platform_integration: {
    label: 'E-Commerce Platform Integration',
    description:
      'Shopify/WooCommerce setup, inventory sync, and product catalog management',
  },
  cms_integration: {
    label: 'CMS Integration',
    description: 'Content management system setup and integration',
  },
  content_creation: {
    label: 'Content Writing & Population',
    description:
      'Copywriting and content population for site pages, distinct from CMS setup itself',
  },
  seo: {
    label: 'SEO Setup',
    description: 'Metadata, sitemap, and search engine optimization',
  },
  analytics: {
    label: 'Analytics Setup',
    description: 'Usage tracking and analytics dashboards',
  },
  deployment: {
    label: 'Deployment & CI/CD Setup',
    description: 'Automated build and deployment pipeline',
  },
  domain_config: {
    label: 'Domain Configuration',
    description: 'DNS setup and custom domain configuration',
  },
  admin_dashboard: {
    label: 'Admin Dashboard',
    description: 'Internal dashboard for managing content and users',
  },
  custom_api: {
    label: 'Custom API Endpoints',
    description:
      "Public or partner-facing API endpoints for external consumption (a companion mobile app, third-party integrations, partner access) - not billed for a web app's own internal backend, which is part of the base build",
  },
  file_uploads: {
    label: 'File Upload System',
    description: 'File storage, upload, and retrieval',
  },
  qa_launch_testing: {
    label: 'QA & Launch Testing',
    description:
      'Manual cross-browser/device testing and user acceptance testing before launch (automated test coverage is included in base development, not billed separately)',
  },
  maintenance_retainer: {
    label: 'Ongoing Maintenance & Support',
    description: 'Monthly retainer covering updates, bug fixes, and support after launch',
  },
  technical_advisory: {
    label: 'Technical Advisory',
    description: 'Technical consultation and planning session',
  },
}

/**
 * The server schema enum's runtime values are snake_case ('admin_dashboard'); the
 * codegen'd client enum's are PascalCase ('AdminDashboard') - same member names, two
 * different wire representations. Normalizing to snake_case lets one lookup serve both.
 */
const toSnakeCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()

/**
 * Looks up display copy by a feature's raw string value, from either enum. Throws
 * rather than returning undefined - every ProjectFeature member (server or client)
 * must have an entry here, so a missing one means featureLabels is out of sync with
 * the enum.
 */
export const getFeatureLabel = (value: string): FeatureLabel => {
  const entry = featureLabels[toSnakeCase(value)]
  if (!entry) {
    throw new Error(`No feature label defined for "${value}"`)
  }
  return entry
}
