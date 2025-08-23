import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'src/graphql/schema/index.ts', // your main schema file
  documents: 'src/apiClients/**/*.ts', // all gql`` queries/mutations
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        skipTypename: false,
        immutableTypes: true,
        apolloReactHooksImportFrom: '@apollo/client/react',
      },
    },
  },
  watch: false,
  hooks: {
    afterOneFileWrite: 'prettier --write',
  },
}

export default config
