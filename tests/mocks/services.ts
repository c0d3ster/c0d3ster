import { vi } from 'vitest'

/**
 * Service mocks for resolver tests
 * Provides comprehensive mocks for all services used by GraphQL resolvers
 */

// Mock UserService
export const createMockUserService = () => ({
  getCurrentUserWithAuth: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  getUsers: vi.fn(),
  updateUser: vi.fn(),
  checkPermission: vi.fn(),
})

// Mock ProjectService
export const createMockProjectService = () => ({
  getProjects: vi.fn(),
  getProjectById: vi.fn(),
  getProjectBySlug: vi.fn(),
  getFeaturedProjects: vi.fn(),
  getAvailableProjects: vi.fn(),
  getAssignedProjects: vi.fn(),
  getMyProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  assignProject: vi.fn(),
  updateProjectStatus: vi.fn(),
  getProjectRequestById: vi.fn(),
})

// Mock ProjectRequestService
export const createMockProjectRequestService = () => ({
  getProjectRequests: vi.fn(),
  getProjectRequestById: vi.fn(),
  getMyProjectRequests: vi.fn(),
  createProjectRequest: vi.fn(),
  updateProjectRequest: vi.fn(),
  approveProjectRequest: vi.fn(),
  rejectProjectRequest: vi.fn(),
  getProjectRequestStatusUpdates: vi.fn(),
})

// Mock ContactService
export const createMockContactService = () => ({
  submitContactForm: vi.fn(),
})

// Mock FileService
export const createMockFileService = () => ({
  listFiles: vi.fn(),
  getFileMetadata: vi.fn(),
  getProjectFiles: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  generatePresignedDownloadUrl: vi.fn(),
  createProjectFileRecord: vi.fn(),
  deleteProjectFileRecordByPath: vi.fn(),
})
