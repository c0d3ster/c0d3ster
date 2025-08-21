import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Load .env.local first, then .env
config({ path: '.env.local' })
config({ path: '.env' })

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
