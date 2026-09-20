'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FaFileAlt, FaPlus, FaTrash } from 'react-icons/fa'

import type { GetProjectFilesQuery } from '@/graphql/generated/graphql'

import { deleteFile } from '@/apiClients'
import { Modal } from '@/components/atoms'

type ProjectFileItem = GetProjectFilesQuery['projectFiles'][number]

type ProjectFilesListProps = {
  files: ReadonlyArray<ProjectFileItem>
  onAddClick: () => void
  onDeletedAction: () => void
}

// Soft cap so the panel can't grow unbounded; the grid wraps into extra rows
// of 3 up to this point rather than needing a separate "view all" UI.
const MAX_VISIBLE_FILES = 9

const isImageFile = (file: ProjectFileItem) =>
  file.contentType?.startsWith('image/') ?? false

export const ProjectFilesList = ({
  files,
  onAddClick,
  onDeletedAction,
}: ProjectFilesListProps) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFileItem | null>(null)
  const [fileToDelete, setFileToDelete] = useState<ProjectFileItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const visibleFiles = files.slice(0, MAX_VISIBLE_FILES)
  const canAddMore = files.length < MAX_VISIBLE_FILES

  const closeFileDetail = () => {
    if (fileToDelete) return
    setSelectedFile(null)
  }

  const closeDeleteConfirmation = () => {
    setFileToDelete(null)
    setDeleteError('')
  }

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return

    try {
      setIsDeleting(true)
      setDeleteError('')
      await deleteFile(fileToDelete.id)
      setFileToDelete(null)
      setSelectedFile(null)
      onDeletedAction()
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete file'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className='grid grid-cols-3 gap-2'>
        {visibleFiles.map((file) => (
          <button
            key={file.id}
            type='button'
            onClick={() => setSelectedFile(file)}
            title={file.caption || file.originalFileName}
            className='relative flex aspect-square items-center justify-center overflow-hidden rounded border border-green-400/20 bg-black/40 transition-all duration-300 hover:border-green-400/50'
          >
            {isImageFile(file) && file.downloadUrl ? (
              <Image
                src={file.downloadUrl}
                alt={file.caption || file.originalFileName}
                fill
                sizes='120px'
                className='object-cover'
              />
            ) : (
              <FaFileAlt className='h-6 w-6 text-green-400/50' />
            )}
          </button>
        ))}

        {canAddMore && (
          <button
            type='button'
            onClick={onAddClick}
            title='Upload file'
            aria-label='Upload file'
            className='flex aspect-square items-center justify-center rounded border border-dashed border-green-400/30 bg-black/20 text-green-400/40 transition-all duration-300 hover:border-green-400/60 hover:text-green-400'
          >
            <FaPlus className='h-4 w-4' />
          </button>
        )}
      </div>

      {selectedFile && (
        <Modal
          title={selectedFile.originalFileName}
          onClose={closeFileDetail}
          maxWidthClassName='max-w-2xl'
        >
          {isImageFile(selectedFile) && selectedFile.downloadUrl ? (
            <div className='relative h-[60vh] w-full'>
              <Image
                src={selectedFile.downloadUrl}
                alt={selectedFile.caption || selectedFile.originalFileName}
                fill
                sizes='90vw'
                className='object-contain'
              />
            </div>
          ) : (
            <div className='flex flex-col items-center gap-4 py-12'>
              <FaFileAlt className='h-16 w-16 text-green-400/50' />
              {selectedFile.downloadUrl && (
                <a
                  href={selectedFile.downloadUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm text-green-400 hover:bg-green-400 hover:text-black'
                >
                  Open file
                </a>
              )}
            </div>
          )}

          {selectedFile.caption && (
            <p className='mt-3 text-center font-mono text-xs text-green-300/70 italic'>
              {selectedFile.caption}
            </p>
          )}

          <div className='mt-4 flex justify-center'>
            <button
              type='button'
              onClick={() => setFileToDelete(selectedFile)}
              title='Delete file'
              aria-label='Delete file'
              className='flex items-center gap-2 rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 hover:bg-red-400 hover:text-black'
            >
              <FaTrash className='h-3 w-3' />
              Delete
            </button>
          </div>
        </Modal>
      )}

      {fileToDelete && (
        <Modal title='DELETE FILE' onClose={closeDeleteConfirmation}>
          <p className='text-center font-mono text-sm text-green-300'>
            Delete{' '}
            <span className='font-bold'>{fileToDelete.originalFileName}</span>?
            This can&apos;t be undone.
          </p>

          <div className='h-6 text-center'>
            {deleteError && (
              <p className='text-xs text-red-400'>{deleteError}</p>
            )}
          </div>

          <div className='flex justify-center gap-3'>
            <button
              type='button'
              onClick={closeDeleteConfirmation}
              disabled={isDeleting}
              className='rounded border border-green-400/30 bg-black/40 px-4 py-2 font-mono text-sm text-green-300 hover:bg-green-400/10 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className='rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-sm text-red-400 hover:bg-red-400 hover:text-black disabled:opacity-50'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
