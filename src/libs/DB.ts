import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'

import * as schema from '@/models/Schema'

import { Env } from './Env'
import { logger } from './Logger'

// Stores the db connection in the global scope to prevent multiple instances due to hot reloading with Next.js
const globalForDb = globalThis as unknown as {
  drizzle: NodePgDatabase<typeof schema>
}

// Need a database for production? Check out https://www.prisma.io/?via=nextjsboilerplate
// Tested and compatible with Next.js Boilerplate
const createDbConnection = () => {
  return drizzle({
    connection: {
      connectionString: Env.DATABASE_URL,
      ssl:
        !Env.DATABASE_URL.includes('localhost') &&
        !Env.DATABASE_URL.includes('127.0.0.1') &&
        !Env.DATABASE_URL.includes('pglite'),
    },
    schema,
  })
}

const db = globalForDb.drizzle || createDbConnection()

// Only store in global during development to prevent hot reload issues
if (Env.NODE_ENV !== 'production') {
  globalForDb.drizzle = db
}

// Run migrations only in production or when explicitly requested
if (Env.NODE_ENV === 'production') {
  try {
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    })
  } catch (error) {
    logger.error('Database migration failed', { error })
    // Don't crash the app if migration fails
  }
}

export { db }
