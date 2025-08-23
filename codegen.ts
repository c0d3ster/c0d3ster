import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'src/graphql/schema/**/*.ts',
  documents: ['src/apiClients/**/*.ts'], // all gql`` queries/mutations
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        apolloClientVersion: 4,
        apolloReactHooksImportFrom: '@apollo/client/react',
        immutableTypes: true,
        useTypeImports: true,
        withHooks: true,
        withResultType: false,
        withVariablesTypes: false,
        withMutationFn: false,
        withMutationOptionsType: false,
      },
    },
  },
  watch: false,
  hooks: {
    afterOneFileWrite:
      'eslint --fix --no-ignore src/graphql/generated/graphql.ts',
  },
}

export default config
