import { execSync } from 'node:child_process'

const runCommand = (command: string, failureMessage: string): void => {
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`${failureMessage}:`, message)
    process.exit(1)
  }
}

// Check if we should run migrations (not on preview builds)
const shouldRunMigrations = process.env.VERCEL_ENV !== 'preview'

if (shouldRunMigrations) {
  console.log('Running database migrations...')
  runCommand('pnpm db:migrate', 'Migration failed')
} else {
  console.log('Skipping migrations for preview build')
}

console.log('Building Next.js...')
runCommand('pnpm build:next', 'Build failed')
