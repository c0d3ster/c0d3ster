import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Files to exclude from Knip analysis
  ignore: [
    'tests/**/*.ts',
    'src/apiClients/**/*.ts', // Ignore API clients - used by GraphQL codegen
    'src/graphql/**/*.ts', // Ignore GraphQL files - used by codegen
    'src/libs/featurePricing.ts', // Admin-only reference data, consumed by InvoiceService (not yet built)
  ],
  // Dependencies to ignore during analysis
  ignoreDependencies: [
    '@commitlint/types',
    '@types/testing-library__jest-dom', // Used in test setup for custom matchers
    'conventional-changelog-conventionalcommits',
    'vite',
  ],
  // Binaries to ignore during analysis
  ignoreBinaries: [],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
}

export default config
