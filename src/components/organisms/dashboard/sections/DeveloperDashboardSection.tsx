'use client'

import { AvailableProjectCard, ProjectStatusCard } from '@/components/molecules'
import { useAssignedProjects, useAvailableProjects, useToast } from '@/hooks'

export const DeveloperDashboardSection = () => {
  const {
    projects: assignedProjects,
    isLoading: assignedLoading,
    error: assignedError,
    refetch: refetchAssigned,
  } = useAssignedProjects()
  const {
    projects: availableProjects,
    isLoading: availableLoading,
    error: availableError,
    refetch: refetchAvailable,
    assignToProject,
  } = useAvailableProjects()

  const { showToast } = useToast()

  // Developer assignment handler
  const handleAssignToProject = async (projectId: string) => {
    try {
      await assignToProject(projectId)
      showToast('Successfully assigned to project!', 'success')
      // Refetch both available projects and assigned projects
      await Promise.all([refetchAvailable(), refetchAssigned()])
    } catch (error) {
      showToast('Failed to assign to project', 'error')
      throw error
    }
  }

  return (
    <>
      {/* Available Projects Section */}
      <div className='mb-8'>
        <h3 className='mb-4 font-mono text-lg font-bold text-blue-400'>
          🔍 AVAILABLE PROJECTS
        </h3>

        {/* Available Projects Loading */}
        {availableLoading && (
          <div className='flex items-center justify-center'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent'></div>
            <span className='ml-3 font-mono text-blue-400'>
              Loading available projects...
            </span>
          </div>
        )}

        {/* Available Projects Error */}
        {availableError && (
          <div className='rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-center'>
            <p className='font-mono text-red-400'>
              Error loading available projects: {availableError}
            </p>
            <button
              type='button'
              onClick={() => refetchAvailable()}
              className='mt-2 rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 transition-all duration-300 hover:bg-red-400 hover:text-black'
            >
              Retry
            </button>
          </div>
        )}

        {/* Available Projects Grid */}
        {!availableLoading &&
          !availableError &&
          availableProjects.length > 0 && (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {availableProjects.map((project) => (
                <AvailableProjectCard
                  key={project.id}
                  project={project}
                  onAssign={handleAssignToProject}
                />
              ))}
            </div>
          )}

        {/* No Available Projects */}
        {!availableLoading &&
          !availableError &&
          availableProjects.length === 0 && (
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

        {/* Assigned Projects Loading */}
        {assignedLoading && (
          <div className='flex items-center justify-center'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent'></div>
            <span className='ml-3 font-mono text-orange-400'>
              Loading assigned projects...
            </span>
          </div>
        )}

        {/* Assigned Projects Error */}
        {assignedError && (
          <div className='rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-center'>
            <p className='font-mono text-red-400'>
              Error loading assigned projects: {assignedError}
            </p>
            <button
              type='button'
              onClick={() => refetchAssigned()}
              className='mt-2 rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 transition-all duration-300 hover:bg-red-400 hover:text-black'
            >
              Retry
            </button>
          </div>
        )}

        {/* Assigned Projects Grid */}
        {!assignedLoading && !assignedError && assignedProjects.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {assignedProjects.map((project) => (
              <ProjectStatusCard key={project.id} item={project} />
            ))}
          </div>
        )}

        {/* No Assigned Projects */}
        {!assignedLoading &&
          !assignedError &&
          assignedProjects.length === 0 && (
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
