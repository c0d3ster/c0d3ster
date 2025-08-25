import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { Buffer } from 'node:buffer'
import { afterEach, beforeEach, vi } from 'vitest'

// Mock apiClients BEFORE any other imports to prevent GraphQL imports
vi.mock('@/apiClients/userApiClient', () => ({
  useGetMe: vi.fn(() => ({ data: { me: null }, loading: false })),
  useGetUser: vi.fn(),
  useUpdateUser: vi.fn(),
  useGetMyDashboard: vi.fn(),
}))

// Mock contact API client specifically
vi.mock('@/apiClients/contactApiClient', () => ({
  useSubmitContactForm: vi.fn(() => [
    vi.fn().mockResolvedValue({ data: { submitContactForm: { id: '1' } } }),
    { loading: false, error: null },
  ]),
}))

// Set Buffer for browser environment with full polyfill
// eslint-disable-next-line node/prefer-global/buffer
if (typeof globalThis.Buffer === 'undefined') {
  // eslint-disable-next-line node/prefer-global/buffer
  globalThis.Buffer = Buffer
}

// Mock process if it doesn't exist (for Node.js compatibility)
if (typeof process === 'undefined') {
  globalThis.process = {
    env: {},
    cwd: () => '',
    platform: 'browser',
  } as any
}

// Mock __dirname for browser environment
if (typeof __dirname === 'undefined') {
  globalThis.__dirname = '/'
}

// Mock Clerk to prevent server-side imports
vi.mock('@clerk/nextjs', () => ({
  // eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
  useUser: () => ({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  }),
  // eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
  useAuth: () => ({
    userId: null,
    isLoaded: true,
    isSignedIn: false,
  }),
  auth: () => Promise.resolve({ userId: null }),
}))

// Mock Clerk server
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => Promise.resolve({ userId: null }),
  currentUser: () => Promise.resolve(null),
  clerkClient: {
    users: {
      getUser: () => Promise.resolve(null),
    },
  },
}))

// Mock Toast utility
vi.mock('@/libs/Toast', () => ({
  Toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// // Mock GraphQL generated types - mock everything with a proxy
// vi.mock('@/graphql/generated/graphql', () => ({
//   GetMeDocument: {},
//   GetMyDashboardDocument: {},
//   GetUserDocument: {},
//   UpdateUserDocument: {},
//   useGetMeQuery: vi.fn(),
//   useGetMyDashboardQuery: vi.fn(),
//   useGetUserQuery: vi.fn(),
//   useUpdateUserMutation: vi.fn(),
//   GetMeQuery: {},
//   GetMyDashboardQuery: {},
//   GetUserQuery: {},
//   UpdateUserMutation: {},
//   GetUserQueryVariables: {},
//   UpdateUserMutationVariables: {},
//   ProjectType: {},
// }))

// // Mock GraphQL main folder to prevent resolver imports
// vi.mock('@/graphql', () => ({
//   resolvers: {},
//   typeDefs: {},
// }))

// Mock database-related modules to prevent Drizzle ORM imports
vi.mock('@/models', () => ({
  schemas: {},
  users: {},
  projects: {},
  projectRequests: {},
  projectStatusUpdates: {},
  projectCollaborators: {},
}))

// // Mock apiClients to prevent GraphQL imports
// vi.mock('@/apiClients', () => ({
//   useGetMe: vi.fn(() => ({ data: { me: null }, loading: false })),
//   useGetUser: vi.fn(),
//   useUpdateUser: vi.fn(),
//   useGetMyDashboard: vi.fn(),
// }))

vi.mock('@/libs/Env', () => ({
  Env: {
    DATABASE_URL: 'test-database-url',
  },
}))

// Mock pg module to prevent database imports
vi.mock('pg', () => ({
  Client: vi.fn(),
  Pool: vi.fn(),
}))

// Mock drizzle-orm to prevent database imports
vi.mock('drizzle-orm', () => ({
  drizzle: vi.fn(),
  pgTable: vi.fn(),
  text: vi.fn(),
  integer: vi.fn(),
  timestamp: vi.fn(),
  boolean: vi.fn(),
  json: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  isNull: vi.fn(),
  ne: vi.fn(),
  pgEnum: vi.fn(),
  sql: vi.fn(),
  SQL: vi.fn(),
}))

// Mock any other database-related modules
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(),
  pgTable: vi.fn(),
  text: vi.fn(),
  integer: vi.fn(),
  timestamp: vi.fn(),
  boolean: vi.fn(),
  json: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  isNull: vi.fn(),
  ne: vi.fn(),
  pgEnum: vi.fn(),
  sql: vi.fn(),
  NodePgDatabase: vi.fn(),
}))

// Mock pg-core
vi.mock('drizzle-orm/pg-core', () => ({
  pgTable: vi.fn(),
  text: vi.fn(),
  integer: vi.fn(),
  timestamp: vi.fn(),
  boolean: vi.fn(),
  json: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  isNull: vi.fn(),
  ne: vi.fn(),
  pgEnum: vi.fn(),
  sql: vi.fn(),
  uuid: vi.fn(),
  varchar: vi.fn(),
}))

// Mock the specific module that's causing the pg import
vi.mock('@/libs/DB', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn(),
  },
}))

// Clear all mocks and timers before each test
beforeEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Cleanup after each test (only in browser environment)
afterEach(() => {
  if (typeof window !== 'undefined') {
    cleanup()
  }
})
