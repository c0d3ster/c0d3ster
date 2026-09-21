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
  const [selectedFile, setSelectedFile] = useState<ProjectFileItem | null>(
    null
  )
  const [fileToDelete, setFileToDelete] = useState<ProjectFileItem | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const visibleFiles = files.slice(0, MAX_VISIBLE_FILES)
  const canAddMore = files.length < MAX_VISIBLE_FILES

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
          <div key={file.id} className='group relative aspect-square'>
            <button
              type='button'
              onClick={() => setSelectedFile(file)}
              title={file.caption || file.originalFileName}
              className='flex size-full items-center justify-center overflow-hidden rounded border border-green-400/20 bg-black/40 transition-all duration-300 hover:border-green-400/50'
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
                <FaFileAlt className='size-6 text-green-400/50' />
              )}
            </button>

            <button
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                setFileToDelete(file)
              }}
              title='Delete file'
              aria-label={`Delete ${file.originalFileName}`}
              className='absolute top-1 right-1 z-10 rounded-full bg-black/70 p-1.5 text-red-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:scale-110 focus-visible:scale-110 focus-visible:opacity-100'
            >
              <FaTrash className='size-3' />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type='button'
            onClick={onAddClick}
            title='Upload file'
            aria-label='Upload file'
            className='flex aspect-square items-center justify-center rounded border border-dashed border-green-400/30 bg-black/20 text-green-400/40 transition-all duration-300 hover:border-green-400/60 hover:text-green-400'
          >
            <FaPlus className='size-4' />
          </button>
        )}
      </div>

      {selectedFile && (
        <Modal
          title={selectedFile.originalFileName}
          onClose={() => setSelectedFile(null)}
          maxWidthClassName='max-w-2xl'
        >
          {isImageFile(selectedFile) && selectedFile.downloadUrl ? (
            <div className='flex justify-center p-3'>
              <div className='relative'>
                <Image
                  key={selectedFile.id}
                  src={selectedFile.downloadUrl}
                  alt={selectedFile.caption || selectedFile.originalFileName}
                  width={1600}
                  height={1600}
                  sizes='90vw'
                  className='size-auto max-h-[60vh] max-w-full object-contain'
                />
                <button
                  type='button'
                  onClick={() => setFileToDelete(selectedFile)}
                  title='Delete file'
                  aria-label='Delete file'
                  className='absolute right-3 bottom-3 flex items-center justify-center rounded-full bg-black/70 p-3 text-red-400 transition-all duration-200 hover:scale-110'
                >
                  <FaTrash className='size-4' />
                </button>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-4 py-12'>
              <FaFileAlt className='size-16 text-green-400/50' />
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

              <button
                type='button'
                onClick={() => setFileToDelete(selectedFile)}
                title='Delete file'
                aria-label='Delete file'
                className='flex items-center justify-center rounded-full bg-black/40 p-3 text-red-400 transition-all duration-200 hover:scale-110'
              >
                <FaTrash className='size-4' />
              </button>
            </div>
          )}

          {selectedFile.caption && (
            <p className='mt-3 text-center font-mono text-xs text-green-300/70 italic'>
              {selectedFile.caption}
            </p>
          )}
        </Modal>
      )}

      {fileToDelete && (
        <Modal title='DELETE FILE' onClose={() => setFileToDelete(null)}>
          <p className='text-center font-mono text-sm text-green-300'>
            Delete{' '}
            <span className='font-bold'>{fileToDelete.originalFileName}</span>
            ? This can&apos;t be undone.
          </p>

          <div className='h-6 text-center'>
            {deleteError && (
              <p className='text-xs text-red-400'>{deleteError}</p>
            )}
          </div>

          <div className='flex justify-center gap-3'>
            <button
              type='button'
              onClick={() => setFileToDelete(null)}
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
