import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Load environment files based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  // In production, load .env.production.local first, then .env.production, then .env
  config({ path: '.env.production.local' }) // Needed for local production builds
  config({ path: '.env.production' })
  config({ path: '.env' })
} else {
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
