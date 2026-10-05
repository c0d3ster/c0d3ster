import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// Live LLM evals. Kept out of the main vitest config so `npm test` never spends money.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['evals/**/*.eval.ts'],
    environment: 'node',
    env: loadEnv('', process.cwd(), ''),
    testTimeout: 600_000,
    reporters: ['verbose'],
  },
})
