# Project Architecture

This project follows a clean, layered architecture with GraphQL, automatic type generation, and modern development practices.

## System Overview

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
GRAPHQL RESOLVER (src/graphql/resolvers/*.ts)
   - Receives GraphQL Query/Mutation
   - Handles auth & permissions via UserService
   - Calls service methods directly
   │
   ▼
SERVICE LAYER (src/services/UserService.ts)
   - Transport-agnostic business logic
   - Authentication & permission checking
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
│   ├── ProjectRequestApiClient.ts
│   ├── ContactApiClient.ts
│   └── index.ts
├── services/             # Backend business logic & authentication
│   ├── UserService.ts    # Auth, permissions, user management
│   ├── ProjectService.ts # Project business logic
│   ├── ProjectRequestService.ts # Project request logic
│   ├── ContactService.ts # Contact form handling
│   └── index.ts
├── graphql/              # GraphQL server layer
│   ├── schema/           # Modular schema files
│   │   ├── user.ts       # User types & operations
│   │   ├── project.ts    # Project types & operations
│   │   ├── projectRequest.ts # Project request types & operations
│   │   ├── contact.ts    # Contact form types & operations
│   │   ├── shared.ts     # Shared types & scalars
│   │   └── index.ts      # Combines all schemas
│   ├── resolvers/        # Modular resolver files
│   │   ├── UserResolver.ts
│   │   ├── ProjectResolver.ts
│   │   ├── ProjectRequestResolver.ts
│   │   ├── ContactResolver.ts
│   │   └── index.ts      # Combines all resolvers
│   ├── context.ts        # GraphQL context setup
│   └── generated/        # Auto-generated types (gitignored)
└── libs/                 # Shared utilities
```

## Key Architectural Principles

### Authentication & Permissions

- **UserService** handles all authentication logic via `getCurrentUserWithAuth()`
- **Permission checking** is done via `UserService.checkPermission()`
- **Centralized auth** - all auth logic centralized in services

### Resolver Structure

- **Direct service calls** - Resolvers call services directly, no intermediate layer
- **Centralized auth** - All resolvers use UserService for authentication
- **Clean separation** - Business logic in services, GraphQL logic in resolvers

## Implementation Patterns

### 1. API Client Pattern

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

export const useGetMe = () => {
  return useQuery<GetMeQuery>(GET_ME)
}
```

### 2. Service Layer Pattern

Services contain all business logic and authentication:

```typescript
// src/services/UserService.ts
export class UserService {
  // Get current user with Clerk authentication
  async getCurrentUserWithAuth() {
    const { userId } = await auth()
    if (!userId) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHORIZED' },
      })
    }

    const user = await db.query.users.findFirst({
      where: eq(schemas.users.clerkId, userId),
    })

    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'USER_NOT_FOUND' },
      })
    }

    return user
  }

  // Check user permissions
  checkPermission(user: any, requiredRole: string) {
    if (!user || typeof user.role !== 'string') {
      throw new GraphQLError('Forbidden', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Role checking logic...
  }
}
```

### 3. Resolver Implementation

Resolvers use services directly:

```typescript
// src/graphql/resolvers/UserResolver.ts
export const userResolvers = {
  Query: {
    me: async () => {
      const currentUser = await userService.getCurrentUserWithAuth()
      return currentUser
    },

    user: async (_: any, { id }: { id: string }) => {
      const currentUser = await userService.getCurrentUserWithAuth()
      userService.checkPermission(currentUser, 'admin')

      return await userService.getUserById(id)
    },
  },
}
```

## Development Workflow

### 1. Schema Changes

When you modify any schema file in `src/graphql/schema/`:

1. **Manual**: Run `npm run codegen` to regenerate types
2. **Watch Mode**: Run `npm run codegen:watch` to auto-regenerate on changes
3. **CI**: Codegen runs automatically before tests (`pretest` script)

### 2. Adding New Operations

1. Add GraphQL operations to `src/apiClients/`
2. Run `npm run codegen` to generate new types
3. Use the generated types in your components

### 3. Adding New Resolvers

1. Add resolver logic to appropriate `src/graphql/resolvers/*.ts` file
2. Add corresponding service methods in `src/services/`
3. Add GraphQL operations in `src/apiClients/`
4. Add schema types in appropriate `src/graphql/schema/*.ts` file

### 4. Adding New Services

1. Create service class in `src/services/`
2. Implement business logic and authentication
3. Add to `src/services/index.ts` for barrel exports
4. Use in resolvers for data access

## Codegen Configuration

The Codegen config (`codegen.ts`) automatically:

- Watches for schema changes
- Generates TypeScript types from API client operations
- Creates React Apollo hooks
- Formats generated files with Prettier
- Ignores generated files in git

## Testing Strategy

### Unit Tests

- Run with `npm run test` (includes pretest codegen)
- Uses jsdom environment for React component testing
- Mocks GraphQL operations via API client mocks

### E2E Tests

- Run with `npm run test:e2e`
- Uses Playwright browser environment
- Tests full application flow

## Benefits

- **Type Safety**: Full TypeScript support for GraphQL operations
- **Auto-completion**: IDE support for all GraphQL fields
- **Runtime Safety**: Compile-time validation of GraphQL queries
- **Developer Experience**: Automatic type generation from operations
- **Maintainability**: Clear separation of concerns between layers
- **Authentication**: Centralized auth logic in services
- **Simplicity**: No complex nested resolver structures
- **Testing**: Easy to mock and test individual layers
