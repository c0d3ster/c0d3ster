import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Load environment files based on NODE_ENV, test environment uses GitHub secrets
if (
  process.env.NODE_ENV === 'production' &&
  process.env.VERCEL_ENV === 'production'
) {
  // Only in actual production deployment, load production env files
  config({ path: '.env.production.local' }) // Needed for local production builds
  config({ path: '.env.production' })
  config({ path: '.env' })
} else if (process.env.NODE_ENV === 'production') {
  // For preview deployments or local production builds without VERCEL_ENV
  // Use environment variables (Vercel preview uses different DATABASE_URL)
  config({ path: '.env' })
} else if (process.env.NODE_ENV === 'development') {
  // In development, load .env.local first, then .env
  config({ path: '.env.local' })
  config({ path: '.env' })
}

export default defineConfig({
  out: './migrations',
  schema: './src/models/Schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
})
