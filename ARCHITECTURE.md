# Project Architecture

This project follows a clean, layered architecture with GraphQL using Apollo Server/Client, type-graphql for schema-first development, and automatic type generation.

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
   (wraps GraphQL operations with Apollo Client)
   │
   ▼
APOLLO CLIENT
   - GraphQL query/mutation execution
   - Caching and state management
   - Type-safe operations
   │
   ▼
APOLLO SERVER (GraphQL API)
   - type-graphql schema generation
   - Resolver execution
   - Authentication & authorization
   │
   ▼
GRAPHQL RESOLVERS (src/graphql/resolvers/*.ts)
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
│   ├── schema/           # type-graphql schema definitions
│   │   ├── user.ts       # User types & operations (decorators)
│   │   ├── project.ts    # Project types & operations (decorators)
│   │   ├── projectRequest.ts # Project request types & operations (decorators)
│   │   ├── contact.ts    # Contact form types & operations (decorators)
│   │   └── index.ts      # Exports all schema types
│   ├── resolvers/        # GraphQL resolvers
│   │   ├── UserResolver.ts
│   │   ├── ProjectResolver.ts
│   │   ├── ProjectRequestResolver.ts
│   │   ├── ContactResolver.ts
│   │   └── index.ts      # Combines all resolvers
│   ├── context.ts        # GraphQL context setup
│   ├── index.ts          # Schema building with type-graphql
│   └── generated/        # Auto-generated client types (gitignored)
├── libs/
│   └── ApolloClient.ts   # Apollo Client configuration
└── app/api/graphql/      # GraphQL API route (Apollo Server)
```

## Key Architectural Principles

### GraphQL Architecture

- **type-graphql**: Schema-first development using TypeScript decorators
- **Apollo Server**: GraphQL server implementation with Next.js integration
- **Apollo Client**: Client-side GraphQL operations with caching
- **Automatic Type Generation**: Client types generated from operations

### Authentication & Permissions

- **UserService** handles all authentication logic via `getCurrentUserWithAuth()`
- **Permission checking** is done via `UserService.checkPermission()`
- **Centralized auth** - all auth logic centralized in services

### Resolver Structure

- **Direct service calls** - Resolvers call services directly, no intermediate layer
- **Centralized auth** - All resolvers use UserService for authentication
- **Clean separation** - Business logic in services, GraphQL logic in resolvers

## Implementation Patterns

### 1. API Client Pattern (Apollo Client)

```typescript
import { useQuery } from '@apollo/client/react'
// src/apiClients/UserApiClient.ts
import { gql } from 'graphql-tag'

import type { GetMeQuery } from '@/graphql/generated/graphql'

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

### 2. type-graphql Schema Definition

```typescript
// src/graphql/schema/user.ts
import { Field, ObjectType, registerEnumType } from 'type-graphql'

@ObjectType()
export class User {
  @Field(() => String)
  id!: string

  @Field(() => String)
  email!: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => UserRole)
  role!: UserRole
}
```

### 3. Service Layer Pattern

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

### 4. Resolver Implementation

Resolvers use services directly:

```typescript
// src/graphql/resolvers/UserResolver.ts
export class UserResolver {
  @Query(() => User)
  async me() {
    const currentUser = await userService.getCurrentUserWithAuth()
    return currentUser
  }

  @Query(() => User)
  async user(@Arg('id') id: string) {
    const currentUser = await userService.getCurrentUserWithAuth()
    userService.checkPermission(currentUser, 'admin')

    return await userService.getUserById(id)
  }
}
```

### 5. Schema Building

```typescript
// src/graphql/index.ts
import { buildSchema } from 'type-graphql'

export const schema = buildSchema({
  resolvers: [
    UserResolver,
    ProjectResolver,
    // ... other resolvers
  ],
  validate: false,
  emitSchemaFile:
    process.env.NODE_ENV === 'development' ? './schema.gql' : false,
})
```

## Development Workflow

### 1. Schema Changes

When you modify any schema file in `src/graphql/schema/`:

1. **Manual**: Run `npm run codegen` to regenerate client types
2. **Watch Mode**: Run `npm run codegen:watch` to auto-regenerate on changes
3. **CI**: Codegen runs automatically before tests (`pretest` script)

### 2. Adding New Operations

1. Add GraphQL operations to `src/apiClients/` using `gql` template literals
2. Run `npm run codegen` to generate new types
3. Use the generated types in your components

### 3. Adding New Resolvers

1. Add resolver class with `@Resolver()` decorator in `src/graphql/resolvers/*.ts`
2. Add corresponding service methods in `src/services/`
3. Add GraphQL operations in `src/apiClients/`
4. Add schema types with decorators in appropriate `src/graphql/schema/*.ts` file

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

**Note**: With type-graphql, the schema is built from your TypeScript classes, but codegen is still needed for client-side operation types and React hooks.

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
- **Schema-First Development**: type-graphql provides decorator-based schema definition
- **Auto-completion**: IDE support for all GraphQL fields
- **Runtime Safety**: Compile-time validation of GraphQL queries
- **Developer Experience**: Automatic type generation from operations
- **Maintainability**: Clear separation of concerns between layers
- **Authentication**: Centralized auth logic in services
- **Apollo Integration**: Full Apollo Server/Client ecosystem support
- **Testing**: Easy to mock and test individual layers
