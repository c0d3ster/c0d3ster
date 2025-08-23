# GraphQL Setup with Codegen

This project uses GraphQL with automatic type generation via GraphQL Codegen.

## Architecture

```
FRONTEND (React / Next.js)
──────────────────────────
components/pages/hooks
   │
   ▼
apiClients/UserApiClient.ts
   - getCurrentUser()
   - updateUser()
   (wraps GraphQL operations)
   │
   ▼
GRAPHQL RESOLVER (src/graphql/resolvers.ts)
   - Receives GraphQL Query/Mutation
   - Handles auth & permissions
   - Calls service methods
   │
   ▼
SERVICE LAYER (src/services/UserService.ts)
   - Transport-agnostic business logic
   - DB access (via Drizzle)
   - Validation, transformations
   │
   ▼
DATABASE / EXTERNAL APIs
   - Drizzle ORM / Clerk / Stripe / Resend
```

## File Structure

```
src/
├── apiClients/           # Frontend API clients (GraphQL operations)
│   ├── UserApiClient.ts
│   ├── ProjectApiClient.ts
│   └── ...
├── services/             # Backend business logic
│   ├── UserService.ts
│   ├── ProjectService.ts
│   └── ...
├── graphql/              # GraphQL server layer
│   ├── schema/           # Modular schema files
│   │   ├── user.ts       # User types & operations
│   │   ├── project.ts    # Project types & operations
│   │   ├── projectRequest.ts # Project request types & operations
│   │   ├── contact.ts    # Contact form types & operations
│   │   ├── base.ts       # Base Query/Mutation types
│   │   └── index.ts      # Combines all schemas
│   ├── schema.ts         # Main schema entry point
│   ├── resolvers.ts      # All GraphQL resolvers
│   └── context.ts        # Auth & DB context
└── lib/                  # Shared utilities
```

## Usage

### 1. Define GraphQL Operations in API Clients

```typescript
// src/apiClients/UserApiClient.ts
import { gql } from '@apollo/client'

const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      role
    }
  }
`

export class UserApiClient {
  constructor(private graphqlClient: any) {}

  async getCurrentUser() {
    const result = await this.graphqlClient.query({
      query: GET_ME,
    })
    return result.data.me
  }
}
```

### 2. Use Generated Types

Codegen automatically generates types from your operations:

```typescript
import type { GetMeQuery } from '@/graphql/generated/graphql'

import { UserApiClient } from '@/apiClients'

const userApi = new UserApiClient(graphqlClient)
const user: GetMeQuery['me'] = await userApi.getCurrentUser()
```

### 3. Service Layer Pattern

Services contain all business logic:

```typescript
// src/services/UserService.ts
export class UserService {
  async getCurrentUser(clerkId: string) {
    return await db.query.users.findFirst({
      where: eq(schemas.users.clerkId, clerkId),
    })
  }
}
```

## Development Workflow

### 1. Schema Changes

When you modify any schema file in `src/graphql/schema/`:

1. **Manual**: Run `npm run codegen` to regenerate types
2. **Watch Mode**: Run `npm run codegen:watch` to auto-regenerate on changes

### 2. Adding New Operations

1. Add GraphQL operations to `src/apiClients/`
2. Run `npm run codegen` to generate new types
3. Use the generated types in your components

### 3. Adding New Resolvers

1. Add resolver logic to `src/graphql/resolvers.ts`
2. Add corresponding service methods in `src/services/`
3. Add GraphQL operations in `src/apiClients/`
4. Add schema types in appropriate `src/graphql/schema/*.ts` file

## Codegen Configuration

The Codegen config (`codegen.ts`) automatically:

- Watches for schema changes
- Generates TypeScript types from API client operations
- Creates React Apollo hooks
- Formats generated files with Prettier
- Ignores generated files in git

## Benefits

- **Type Safety**: Full TypeScript support for GraphQL operations
- **Auto-completion**: IDE support for all GraphQL fields
- **Runtime Safety**: Compile-time validation of GraphQL queries
- **Developer Experience**: Automatic type generation from operations
- **Maintainability**: Clear separation of concerns between layers
- **Simplicity**: No complex nested resolver structures
