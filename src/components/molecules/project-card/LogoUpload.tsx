'use client'

import { useRef, useState } from 'react'

import { uploadProjectLogo } from '@/apiClients'

type LogoUploadProps = {
  projectId: string
  onLogoUploadedAction: (logoUrl: string) => void
  showCancel?: boolean
}

export const LogoUpload = ({
  projectId,
  onLogoUploadedAction,
  showCancel = false,
}: LogoUploadProps) => {
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [internalShowCancel, setInternalShowCancel] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (fileToUpload: File) => {
    try {
      setIsUploading(true)
      setUploadStatus('Uploading logo...')

      const downloadUrl = await uploadProjectLogo(projectId, fileToUpload)

      setUploadStatus('Logo uploaded successfully!')
      onLogoUploadedAction(downloadUrl)
      setInternalShowCancel(false)
    } catch (error) {
      setUploadStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Only allow image files
      if (!selectedFile.type.startsWith('image/')) {
        setUploadStatus('Please select an image file (PNG, JPG, etc.)')
        setInternalShowCancel(true)
        return
      }
      setUploadStatus('')
      setInternalShowCancel(true)
      // Auto-upload the file
      handleUpload(selectedFile)
    }
  }

  const handleCancel = () => {
    setUploadStatus('')
    setIsUploading(false)
    setInternalShowCancel(false)
    onLogoUploadedAction('')
  }

  return (
    <div className='flex h-full flex-col items-center justify-between space-y-4'>
      {/* Header - Top */}
      <div className='text-center'>
        <h4 className='mb-4 font-mono text-sm font-bold text-green-400'>
          UPLOAD PROJECT LOGO
        </h4>
        <p className='text-xs text-green-300 opacity-70'>
          Add a custom logo for your project
        </p>
      </div>

      {/* File Input - Middle */}
      <div className='flex flex-col items-center space-y-3'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileSelect}
          className='block w-full max-w-xs text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-green-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-400 hover:file:bg-green-500/30'
        />
      </div>

      {/* Status and Cancel - Bottom */}
      <div className='flex flex-col items-center space-y-3'>
        {/* Reserve space for status message */}
        <div className='h-6 text-center'>
          {uploadStatus && (
            <p
              className={`text-xs ${uploadStatus.includes('Error') || uploadStatus.includes('Please select') ? 'text-red-400' : 'text-green-400'}`}
            >
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Cancel button */}
        {(showCancel || internalShowCancel) && (
          <button
            onClick={handleCancel}
            disabled={isUploading}
            type='button'
            className='font-mono text-xs text-green-400/70 hover:text-green-400'
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
