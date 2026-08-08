'use client'

import { useGetProjectFiles } from '@/apiClients'

import { ProjectFilesList } from './ProjectFilesList'
import { ProjectFileUpload } from './ProjectFileUpload'

type ProjectFilesPanelProps = {
  projectId: string
}

export const ProjectFilesPanel = ({ projectId }: ProjectFilesPanelProps) => {
  const { data, loading, error, refetch } = useGetProjectFiles(projectId)

  return (
    <div className='space-y-6'>
      <ProjectFileUpload
        projectId={projectId}
        onUploadedAction={() => refetch()}
      />

      {loading && (
        <p className='py-8 text-center font-mono text-sm text-green-400/60'>
          Loading files...
        </p>
      )}

      {error && (
        <p className='py-8 text-center font-mono text-sm text-red-400/60'>
          Failed to load files.
        </p>
      )}

      {!loading && !error && (
        <ProjectFilesList files={data?.projectFiles ?? []} />
      )}
    </div>
  )
}
