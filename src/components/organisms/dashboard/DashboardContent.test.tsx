import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserRole } from '@/graphql/generated/graphql'

import { DashboardContent } from './DashboardContent'

// Mock the API clients
const mockUseGetMe = vi.fn()
const mockUseGetMyDashboard = vi.fn()

vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useGetMe: () => mockUseGetMe(),
    useGetMyDashboard: () => mockUseGetMyDashboard(),
  }
})

// Mock the child components
vi.mock('@/components/molecules', () => ({
  CompactUserProfile: () => (
    <div data-testid='compact-user-profile'>User Profile</div>
  ),
}))

vi.mock('./sections', () => ({
  AdminDashboardSection: () => (
    <div data-testid='admin-dashboard-section'>Admin Section</div>
  ),
  DeveloperDashboardSection: ({ availableProjects, assignedProjects }: any) => (
    <div data-testid='developer-dashboard-section'>
      Available: {availableProjects?.length || 0}, Assigned:{' '}
      {assignedProjects?.length || 0}
    </div>
  ),
  UserProjectsAndRequests: ({ projects, projectRequests }: any) => (
    <div data-testid='user-projects-and-requests'>
      Projects: {projects?.length || 0}, Requests:{' '}
      {projectRequests?.length || 0}
    </div>
  ),
}))

describe('DashboardContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading States', () => {
    it('shows loading state when user data is loading', () => {
      mockUseGetMe.mockReturnValue({
        data: null,
        loading: true,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: null,
        loading: false,
      })

      render(<DashboardContent />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows loading state when dashboard data is loading', () => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Client } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: null,
        loading: true,
      })

      render(<DashboardContent />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows loading projects when content is loading', () => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Client } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: null,
        loading: true,
      })

      render(<DashboardContent />)

      expect(screen.getByText('Loading projects...')).toBeInTheDocument()
    })
  })

  describe('User Role Display', () => {
    it('shows regular user stats for User role', () => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Client } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: {
          myDashboard: {
            summary: {
              totalProjects: 5,
              totalRequests: 3,
              pendingReviewRequests: 1,
              inReviewRequests: 2,
              activeProjects: 4,
            },
          },
        },
        loading: false,
      })

      render(<DashboardContent />)

      expect(screen.getByText('Projects:')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Total Requests:')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Pending Review:')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('In Review:')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Active:')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('shows developer/admin stats for Developer role', () => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Developer } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: {
          myDashboard: {
            summary: {
              totalProjects: 3,
              pendingReviewRequests: 1,
            },
            availableProjects: [{ id: '1' }, { id: '2' }],
            assignedProjects: [{ id: '3' }],
          },
        },
        loading: false,
      })

      render(<DashboardContent />)

      expect(screen.getByText('Available:')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Assigned:')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Your Projects:')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument() // 3 + 1
    })

    it('shows admin section for Admin role', () => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Admin } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: {
          myDashboard: {
            summary: {
              pendingReviewRequests: 2,
              inReviewRequests: 1,
            },
            projectRequests: [
              { id: '1', status: 'APPROVED' },
              { id: '2', status: 'PENDING' },
            ],
          },
        },
        loading: false,
      })

      render(<DashboardContent />)

      expect(
        screen.getByText('🔧 PROJECT REQUESTS MANAGEMENT')
      ).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-section')).toBeInTheDocument()
      expect(screen.getByText('Pending Review')).toBeInTheDocument()
      expect(screen.getByText('In Review')).toBeInTheDocument()
      expect(screen.getByText('Approved')).toBeInTheDocument()

      // Check specific counts in admin section
      const adminContainer = screen
        .getByText('🔧 PROJECT REQUESTS MANAGEMENT')
        .closest('div')

      expect(adminContainer).toHaveTextContent('2') // Pending Review count
      expect(adminContainer).toHaveTextContent('1') // In Review count
      expect(adminContainer).toHaveTextContent('1') // Approved count
    })
  })

  describe('Quick Actions', () => {
    beforeEach(() => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Client } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: { myDashboard: { summary: {} } },
        loading: false,
      })
    })

    it('renders quick action buttons', () => {
      render(<DashboardContent />)

      expect(screen.getByText('QUICK ACTIONS')).toBeInTheDocument()
      expect(screen.getByText('➕ REQUEST PROJECT')).toBeInTheDocument()
      expect(screen.getByText('👤 PROFILE SETTINGS')).toBeInTheDocument()
    })

    it('has correct links for quick actions', () => {
      render(<DashboardContent />)

      const requestProjectLink = screen
        .getByText('➕ REQUEST PROJECT')
        .closest('a')
      const profileSettingsLink = screen
        .getByText('👤 PROFILE SETTINGS')
        .closest('a')

      expect(requestProjectLink).toHaveAttribute(
        'href',
        '/dashboard/request-project'
      )
      expect(profileSettingsLink).toHaveAttribute(
        'href',
        '/dashboard/user-profile'
      )
    })
  })

  describe('Component Integration', () => {
    beforeEach(() => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Client } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: {
          myDashboard: {
            projects: [{ id: '1' }, { id: '2' }],
            projectRequests: [{ id: '3' }],
          },
        },
        loading: false,
      })
    })

    it('renders CompactUserProfile', () => {
      render(<DashboardContent />)

      expect(screen.getByTestId('compact-user-profile')).toBeInTheDocument()
    })

    it('renders UserProjectsAndRequests with correct props', () => {
      render(<DashboardContent />)

      expect(
        screen.getByTestId('user-projects-and-requests')
      ).toBeInTheDocument()
      expect(screen.getByText('Projects: 2, Requests: 1')).toBeInTheDocument()
    })

    it('renders DeveloperDashboardSection for Developer role', () => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Developer } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: {
          myDashboard: {
            availableProjects: [{ id: '1' }],
            assignedProjects: [{ id: '2' }],
            projects: [],
            projectRequests: [],
          },
        },
        loading: false,
      })

      render(<DashboardContent />)

      expect(
        screen.getByTestId('developer-dashboard-section')
      ).toBeInTheDocument()
      expect(screen.getByText('Available: 1, Assigned: 1')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      mockUseGetMe.mockReturnValue({
        data: null,
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: null,
        loading: false,
      })

      render(<DashboardContent />)

      // Should not crash and should show user stats with 0 values
      expect(screen.getByText('Projects:')).toBeInTheDocument()
      expect(screen.getByText('Total Requests:')).toBeInTheDocument()
      expect(screen.getByText('Pending Review:')).toBeInTheDocument()
      expect(screen.getByText('In Review:')).toBeInTheDocument()
      expect(screen.getByText('Active:')).toBeInTheDocument()

      // Check that all stats show 0
      const statsSection = screen.getByText('Projects:').closest('div')

      expect(statsSection).toHaveTextContent('0')
    })

    it('handles missing dashboard data gracefully', () => {
      mockUseGetMe.mockReturnValue({
        data: { me: { role: UserRole.Client } },
        loading: false,
      })
      mockUseGetMyDashboard.mockReturnValue({
        data: null,
        loading: false,
      })

      render(<DashboardContent />)

      // Should not crash and should show user stats with 0 values
      expect(screen.getByText('Projects:')).toBeInTheDocument()
      expect(screen.getByText('Total Requests:')).toBeInTheDocument()
      expect(screen.getByText('Pending Review:')).toBeInTheDocument()
      expect(screen.getByText('In Review:')).toBeInTheDocument()
      expect(screen.getByText('Active:')).toBeInTheDocument()

      // Check that all stats show 0
      const statsSection = screen.getByText('Projects:').closest('div')

      expect(statsSection).toHaveTextContent('0')
    })
  })
})
