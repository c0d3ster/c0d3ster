'use client'

import { useState } from 'react'

import { useGetProjectFiles } from '@/apiClients'
import { Modal } from '@/components/atoms'

import { ProjectFilesList } from './ProjectFilesList'
import { ProjectFileUpload } from './ProjectFileUpload'

type ProjectFilesPanelProps = {
  projectId: string
}

export const ProjectFilesPanel = ({ projectId }: ProjectFilesPanelProps) => {
  const { data, loading, error, refetch } = useGetProjectFiles(projectId)
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className='w-full space-y-3'>
      {loading && (
        <p className='py-4 text-center font-mono text-xs text-green-400/60'>
          Loading files...
        </p>
      )}

      {error && (
        <p className='py-4 text-center font-mono text-xs text-red-400/60'>
          Failed to load files.
        </p>
      )}

      {!loading && !error && (
        <ProjectFilesList
          files={data?.projectFiles ?? []}
          onAddClick={() => setShowUpload(true)}
          onDeletedAction={() => refetch()}
        />
      )}

      {showUpload && (
        <Modal title='UPLOAD FILE' onClose={() => setShowUpload(false)}>
          <ProjectFileUpload
            projectId={projectId}
            onUploadedAction={() => {
              refetch()
              setShowUpload(false)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
