'use client'

import { useState } from 'react'

import { useGenerateFileDownloadUrl, useUploadProjectLogo } from '@/apiClients'
import { Button } from '@/components/atoms'

type LogoUploadProps = {
  projectId: string
  onLogoUploadedAction: (logoUrl: string) => void
}

export const LogoUpload = ({
  projectId,
  onLogoUploadedAction,
}: LogoUploadProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const [uploadLogo] = useUploadProjectLogo()
  const [generateDownloadUrl] = useGenerateFileDownloadUrl()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Only allow image files
      if (!selectedFile.type.startsWith('image/')) {
        setUploadStatus('Please select an image file (PNG, JPG, etc.)')
        return
      }
      setFile(selectedFile)
      setUploadStatus('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      setUploadStatus('Setting up logo upload...')

      // Step 1: Generate presigned URL and update project logo
      const result = await uploadLogo({
        variables: {
          projectId,
          input: {
            fileName: file.name,
            originalFileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            projectId,
            environment: 'DEV',
          },
        },
      })

      const { uploadUrl, key } = (result.data as any).uploadProjectLogo
      setUploadStatus('Uploading logo...')

      // Step 2: Upload file using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (uploadResponse.ok) {
        setUploadStatus('Generating download URL...')
        // Generate a presigned download URL using GraphQL
        const downloadResult = await generateDownloadUrl({
          variables: { key },
        })
        const downloadUrl = (downloadResult.data as any).generateFileDownloadUrl

        setUploadStatus('Logo uploaded and project updated successfully!')
        onLogoUploadedAction(downloadUrl)
        setFile(null)
      } else {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }
    } catch (error) {
      setUploadStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className='flex flex-col items-center space-y-4'>
      <div className='text-center'>
        <h4 className='mb-2 font-mono text-sm font-bold text-green-400'>
          UPLOAD PROJECT LOGO
        </h4>
        <p className='text-xs text-green-300 opacity-70'>
          Add a custom logo for your project
        </p>
      </div>

      <div className='flex flex-col items-center space-y-3'>
        <input
          type='file'
          accept='image/*'
          onChange={handleFileSelect}
          className='block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-green-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-400 hover:file:bg-green-500/30'
        />

        {file && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            size='sm'
            className='border-green-400/30 bg-green-500/20 text-green-400 hover:bg-green-500/30'
          >
            {isUploading ? 'Uploading...' : 'Upload Logo'}
          </Button>
        )}
      </div>

      {uploadStatus && (
        <div className='text-center'>
          <p
            className={`text-xs ${uploadStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}
          >
            {uploadStatus}
          </p>
        </div>
      )}
    </div>
  )
}
