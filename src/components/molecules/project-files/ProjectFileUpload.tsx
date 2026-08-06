'use client'

import { useRef, useState } from 'react'

import { uploadProjectFile } from '@/apiClients'
import { FilePlacement } from '@/graphql/generated/graphql'

type ProjectFileUploadProps = {
  projectId: string
  onUploadedAction: () => void
}

const PLACEMENT_OPTIONS: { value: FilePlacement; label: string }[] = [
  { value: FilePlacement.Gallery, label: 'Gallery' },
  { value: FilePlacement.Document, label: 'Document' },
  { value: FilePlacement.Other, label: 'Other' },
]

export const ProjectFileUpload = ({
  projectId,
  onUploadedAction,
}: ProjectFileUploadProps) => {
  const [caption, setCaption] = useState('')
  const [placement, setPlacement] = useState<FilePlacement>(
    FilePlacement.Gallery
  )
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    try {
      setIsUploading(true)
      setUploadStatus('Uploading file...')

      await uploadProjectFile(projectId, selectedFile, {
        caption: caption.trim() || undefined,
        placement,
      })

      setUploadStatus('File uploaded successfully!')
      setCaption('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      onUploadedAction()
    } catch (error) {
      setUploadStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className='space-y-4 rounded-lg border border-green-400/20 bg-black/60 p-4'>
      <h4 className='font-mono text-sm font-bold text-green-400'>
        UPLOAD FILE
      </h4>

      <div className='flex flex-col gap-2 sm:flex-row'>
        <input
          type='text'
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder='Caption (optional)'
          disabled={isUploading}
          className='flex-1 rounded border border-green-400/30 bg-black/40 px-3 py-2 font-mono text-sm text-green-300 placeholder:text-green-300/40'
        />
        <select
          value={placement}
          onChange={(event) =>
            setPlacement(event.target.value as FilePlacement)
          }
          disabled={isUploading}
          className='rounded border border-green-400/30 bg-black/40 px-3 py-2 font-mono text-sm text-green-300'
        >
          {PLACEMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        onChange={handleFileSelect}
        disabled={isUploading}
        className='block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-green-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-400 hover:file:bg-green-500/30'
      />

      <div className='h-6 text-center'>
        {uploadStatus && (
          <p
            className={`text-xs ${uploadStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}
          >
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  )
}
