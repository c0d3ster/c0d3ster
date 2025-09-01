'use client'

import type { GetMyDashboardQuery } from '@/graphql/generated/graphql'

import { useAssignProject, useGetMe } from '@/apiClients'
import { AvailableProjectCard, ProjectStatusCard } from '@/components/molecules'
import { Toast } from '@/libs/Toast'

type DeveloperDashboardSectionProps = {
  availableProjects: NonNullable<
    GetMyDashboardQuery['myDashboard']
  >['availableProjects']
  assignedProjects: NonNullable<
    GetMyDashboardQuery['myDashboard']
  >['assignedProjects']
  onDataRefreshAction: () => void
}

export const DeveloperDashboardSection = ({
  availableProjects,
  assignedProjects,
  onDataRefreshAction,
}: DeveloperDashboardSectionProps) => {
  const { data: currentUserData } = useGetMe()
  const [assignProject] = useAssignProject()

  const currentUser = currentUserData?.me

  // Developer assignment handler
  const handleAssignToProject = async (projectId: string) => {
    if (!currentUser?.id) {
      Toast.error('User not authenticated')
      return
    }

    try {
      await assignProject({
        variables: { projectId, developerId: currentUser.id },
      })
      Toast.success('Successfully assigned to project!')
      // Refresh the dashboard data
      onDataRefreshAction()
    } catch (error) {
      Toast.error('Failed to assign to project')
      console.error('Assign project error:', error)
    }
  }

  return (
    <>
      {/* Available Projects Section */}
      <div className='mb-8'>
        <h3 className='mb-4 font-mono text-lg font-bold text-blue-400'>
          🔍 AVAILABLE PROJECTS
        </h3>

        {/* Available Projects Grid */}
        {availableProjects.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {availableProjects.map((project: any) => (
              <AvailableProjectCard
                key={project.id}
                project={project}
                onAssignAction={handleAssignToProject}
              />
            ))}
          </div>
        )}

        {/* No Available Projects */}
        {availableProjects.length === 0 && (
          <div className='flex flex-col items-center justify-center text-center'>
            <div className='mb-2 text-2xl'>🔍</div>
            <p className='font-mono text-sm text-blue-300/60'>
              No available projects at the moment
            </p>
          </div>
        )}
      </div>

      {/* Assigned Projects Section */}
      <div className='mb-8'>
        <h3 className='mb-4 font-mono text-lg font-bold text-orange-400'>
          ⚡ ASSIGNED PROJECTS
        </h3>

        {/* Assigned Projects Grid */}
        {assignedProjects.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {assignedProjects.map((project: any) => (
              <ProjectStatusCard key={project.id} item={project} />
            ))}
          </div>
        )}

        {/* No Assigned Projects */}
        {assignedProjects.length === 0 && (
          <div className='flex flex-col items-center justify-center text-center'>
            <div className='mb-2 text-2xl'>⚡</div>
            <p className='font-mono text-sm text-orange-300/60'>
              No assigned projects yet
            </p>
          </div>
        )}
      </div>
    </>
  )
}
