import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: [
      // Vite 7's per-environment resolver skips vite-tsconfig-paths@5, so
      // vitest projects need these aliases spelled out (mirrors tsconfig paths).
      { find: '@/public', replacement: path.resolve(rootDir, 'public') },
      { find: '@/tests', replacement: path.resolve(rootDir, 'tests') },
      { find: '@', replacement: path.resolve(rootDir, 'src') },
      { find: 'buffer', replacement: 'buffer' },
    ],
  },
  test: {
    setupFiles: ['tests/setup.ts'],
    env: loadEnv('', process.cwd(), ''),
    globals: true, // This provides Jest compatibility globals like expect
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{js,ts,tsx}'],
          exclude: ['src/hooks/**/*.test.ts'],
          environment: 'jsdom',
          setupFiles: ['tests/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          include: ['src/hooks/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            screenshotDirectory: 'vitest-test-results',
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
