import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Skip migrations entirely for Vercel preview builds
if (process.env.VERCEL_ENV === 'preview') {
  // Preview builds shouldn't run migrations - provide empty DATABASE_URL to make migrate fail gracefully
  process.env.DATABASE_URL = ''
}

// Load environment files for local builds only
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
  // Local production build - load production env files
  config({ path: '.env.production.local' })
  config({ path: '.env.production' })
  config({ path: '.env' }) // Fallback for any missing vars
} else if (!process.env.VERCEL_ENV && process.env.NODE_ENV !== 'test') {
  // Local development build - load development env files
  config({ path: '.env.local' })
  config({ path: '.env' }) // Fallback for any missing vars
}
// Remote environments (CI: NODE_ENV=test, Vercel: VERCEL_ENV set) use environment variables only

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
