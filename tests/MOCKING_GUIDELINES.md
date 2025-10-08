# Test Mocking Guidelines

This document outlines the strategy for mocking dependencies in our test suite to reduce duplication and improve maintainability.

## Philosophy

**Default to individual test file mocking** unless the mock is simple, stable, and used across 80%+ of test files.

## Why We Mock

We mock dependencies for different reasons:

1. **Prevent side effects** - Avoid real HTTP requests, file system operations, etc.
2. **Test behavior verification** - Verify that specific methods are called with expected parameters
3. **Control test environment** - Ensure predictable, isolated test conditions
4. **Speed up tests** - Avoid slow external dependencies

The logger is mocked because **tests verify that logging calls happen** with specific error messages, not just to prevent side effects.

## Mocking Strategy

### Mock in `tests/setup.ts` when:

1. **Environment/Browser polyfills** - Required for test environment
   - `Buffer`, `process`, `__dirname`
   - `IntersectionObserver`

2. **Infrastructure libraries** - Used consistently across all tests
   - `next/image` - Next.js component used in many UI tests (10+ files)
   - `next/link` - Next.js Link component used in many UI tests (5+ files)
   - Database mocks (`@/libs/DB`, `drizzle-orm`, `pg`) - Used in all service tests
   - `@/libs/Env` - Environment configuration
   - `@/libs/Logger` - Tests verify that logging calls happen with specific messages (8+ files)
   - `@/libs/Toast` - Tests verify that toast calls happen with specific messages (4+ files)

3. **Third-party libraries** - Simple, stable mocks that rarely need customization
   - Only if used in 80%+ of test files

### Mock in individual test files when:

1. **Service dependencies** - Need specific behavior per test
   - `@/utils` functions (isAdminRole, isDeveloperOrHigherRole, etc.)

2. **Authentication/Authorization** - Vary by test scenario
   - `@clerk/nextjs` and `@clerk/nextjs/server`
   - User roles, permissions, authentication states

3. **API clients** - Need different responses per test
   - GraphQL mutations and queries
   - Different loading states, errors, success responses

4. **Complex mocks** - Require specific implementation details
   - File upload services
   - Email services
   - External API integrations

## Using Test Utilities

We provide reusable mock utilities in `tests/mocks/` for mocks used in 3+ test files:

```typescript
import {
  createMockClerkUser,
  createMockFullProject,
  createMockProject,
  createMockProjectRequest,
} from '@/tests/mocks'

// Use in individual test files
vi.mock('@clerk/nextjs', () => createMockClerkUser())
vi.mock('@/utils', () => ({
  isAdminRole: vi.fn(),
  isDeveloperOrHigherRole: vi.fn(),
  findProjectBySlug: vi.fn(),
  hasSlugConflict: vi.fn(),
  formatProfileDate: (date: string) => new Date(date).toLocaleDateString(),
}))
// Logger and Toast are mocked globally in setup.ts

// Use project mock utilities for consistent test data
const mockProject = createMockProject({
  title: 'Custom Test Project',
  status: ProjectStatus.InProgress,
  featured: true,
})

const mockFullProject = createMockFullProject({
  title: 'Full Project with Client/Developer',
  status: ProjectStatus.Completed,
  budget: 10000,
  progressPercentage: 100,
})

const mockRequest = createMockProjectRequest({
  title: 'Custom Test Request',
  budget: 10000,
  status: ProjectStatus.Requested,
})
```

For mocks used in fewer than 3 files, define them inline in the test file.

## Current Mock Usage Analysis

Based on analysis of all test files:

### **Global Mocks (setup.ts) - 5+ files with identical implementations:**

- `@/libs/Logger` - 8+ files
- `@/libs/Toast` - 4+ files
- `next/image` - 10+ files
- `next/link` - 5+ files
- Database mocks - All service tests

### **Individual Test Mocks - Different implementations per test:**

- `@clerk/nextjs` - 4 files (different user states, custom mock functions)
- `@/utils` - 6 files (different function combinations per test)
- `@/apiClients` - 9 files (different hook combinations per test)
- `next/navigation` - 4 files (different router behaviors per test)

### **Low Usage Mocks - Keep individual:**

- `@/emails` - 1 file
- `@aws-sdk` - 1 file
- `@/libs/Env` - 1 file

### **Data Mock Utilities - Used in 15+ files:**

- `createMockProject()` - Creates ProjectDisplayFragment with sensible defaults
- `createMockFullProject()` - Creates full Project type with all fields (client, developer, etc.)
- `createMockProjectRequest()` - Creates ProjectRequestDisplayFragment with sensible defaults
- `createMockProjects(count)` - Creates arrays of projects for list testing
- `createMockProjectRequests(count)` - Creates arrays of requests for list testing

## Mock File Structure

```text
tests/
├── setup.ts              # Global mocks (Logger, Toast, next/image, next/link, DB, etc.)
├── mocks/                # Domain utilities (used in 3+ files)
│   ├── auth.ts          # Clerk authentication mocks
│   ├── utils.ts         # @/utils function mocks
│   ├── projects.ts      # Project and ProjectRequest mock utilities
│   └── index.ts         # Re-exports
└── e2e/                 # E2E tests (Playwright route mocking)
```

**Rule**: Only create mock utilities for dependencies used in 3+ test files.

## Examples

### ✅ Good: Mock in individual test file

```typescript
// UserService.test.ts
// For mocks used in 3+ files, use utilities
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
  clerkClient: {
    users: {
      getUser: vi.fn().mockResolvedValue(null),
    },
  },
}))

// For mocks used in 3+ files, use utilities
vi.mock('@/utils', () => ({
  isAdminRole: vi.fn().mockReturnValue(true), // Specific behavior for this test
  isDeveloperOrHigherRole: vi.fn(),
  findProjectBySlug: vi.fn(),
  hasSlugConflict: vi.fn(),
  formatProfileDate: (date: string) => new Date(date).toLocaleDateString(),
}))
```

### ✅ Good: Mock in setup.ts

```typescript
// tests/setup.ts
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'next-image',
      'data-src': src,
      'data-alt': alt,
      ...props,
    }),
}))
```

### ❌ Bad: Duplicate mocking

```typescript
// Don't mock the same thing in both setup.ts and individual test files
// setup.ts
vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn() } }))

// UserService.test.ts - This is duplication!
vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn() } }))
```

## Migration Checklist

When refactoring existing tests:

1. ✅ Remove duplicated mocks from `setup.ts`
2. ✅ Add necessary mocks to individual test files
3. ✅ Use `test-utils.ts` helpers where possible
4. ✅ Ensure each test file only mocks what it actually uses
5. ✅ Verify tests still pass after refactoring

## Benefits

- **Reduced duplication** - No more mocking the same thing in multiple places
- **Better test isolation** - Each test controls its own dependencies
- **Easier maintenance** - Changes to mocks only affect relevant tests
- **Clearer intent** - Easy to see what each test depends on
- **More flexible** - Tests can customize mock behavior as needed
