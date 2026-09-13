'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FaFileAlt, FaPlus } from 'react-icons/fa'

import type { GetProjectFilesQuery } from '@/graphql/generated/graphql'

import { Modal } from '@/components/atoms'

type ProjectFileItem = GetProjectFilesQuery['projectFiles'][number]

type ProjectFilesListProps = {
  files: ReadonlyArray<ProjectFileItem>
  onAddClick: () => void
}

// Soft cap so the panel can't grow unbounded; the grid wraps into extra rows
// of 3 up to this point rather than needing a separate "view all" UI.
const MAX_VISIBLE_FILES = 9

const isImageFile = (file: ProjectFileItem) =>
  file.contentType?.startsWith('image/') ?? false

export const ProjectFilesList = ({
  files,
  onAddClick,
}: ProjectFilesListProps) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFileItem | null>(
    null
  )

  const visibleFiles = files.slice(0, MAX_VISIBLE_FILES)
  const canAddMore = files.length < MAX_VISIBLE_FILES

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
          onClose={() => setSelectedFile(null)}
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
        </Modal>
      )}
    </>
  )
}
