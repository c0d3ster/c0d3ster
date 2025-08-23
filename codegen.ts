import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'src/graphql/schema/**/*.ts', // your GraphQL schemas
  documents: 'src/apiClients/**/*.ts', // where gql`` queries live
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        reactApolloVersion: 4, // matches your @apollo/client v4
        withHooks: true,
        withHOC: false,
        withComponent: false,
        reactApolloImportFrom: '@apollo/client',
        skipTypename: false,
        immutableTypes: true,
        // no skipToken here
      },
    },
  },
  watch: false,
  hooks: {
    afterOneFileWrite: 'prettier --write',
  },
}

export default config
