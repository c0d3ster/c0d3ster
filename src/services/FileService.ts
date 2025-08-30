import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { Env } from '@/libs/Env'

export type FileUploadOptions = {
  fileName: string
  originalFileName: string
  fileType: string
  fileSize: number
  contentType: string
  userId: string
  projectId?: string
  environment?: 'dev' | 'prod'
}

export type FileMetadata = {
  key: string
  fileName: string
  originalFileName: string
  fileType: string
  fileSize: number
  contentType: string
  uploadedBy: string
  projectId?: string
  environment: 'dev' | 'prod'
  uploadedAt: Date
}

export class FileService {
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${Env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Env.R2_ACCESS_KEY_ID,
        secretAccessKey: Env.R2_SECRET_ACCESS_KEY,
      },
    })
    this.bucketName = Env.R2_BUCKET_NAME
  }

  private generateKey(options: FileUploadOptions): string {
    const timestamp = Date.now()
    const sanitizedFileName = options.fileName.replace(/[^a-z0-9.-]/gi, '_')

    if (options.projectId) {
      return `projects/${options.projectId}/${timestamp}_${sanitizedFileName}`
    }

    return `users/${options.userId}/${timestamp}_${sanitizedFileName}`
  }

  async generatePresignedUploadUrl(options: FileUploadOptions): Promise<{
    uploadUrl: string
    key: string
    metadata: FileMetadata
  }> {
    const key = this.generateKey(options)
    const metadata: FileMetadata = {
      key,
      fileName: options.fileName,
      originalFileName: options.originalFileName,
      fileType: options.fileType,
      fileSize: options.fileSize,
      contentType: options.contentType,
      uploadedBy: options.userId,
      projectId: options.projectId,
      environment: options.environment || 'dev',
      uploadedAt: new Date(),
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: options.contentType,
      Metadata: {
        originalFileName: options.originalFileName,
        fileType: options.fileType,
        fileSize: options.fileSize.toString(),
        uploadedBy: options.userId,
        projectId: options.projectId || '',
        environment: options.environment || 'dev',
        uploadedAt: new Date().toISOString(),
      },
    })

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    }) // 1 hour

    return {
      uploadUrl,
      key,
      metadata,
    }
  }

  async generatePresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 }) // 1 hour
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    await this.s3Client.send(command)
  }

  async listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    })

    const response = await this.s3Client.send(command)
    return response.Contents?.map((obj) => obj.Key || '') || []
  }

  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const response = await this.s3Client.send(command)
      const metadata = response.Metadata

      if (!metadata) return null

      return {
        key,
        fileName: metadata.fileName || '',
        originalFileName: metadata.originalFileName || '',
        fileType: metadata.fileType || '',
        fileSize: Number.parseInt(metadata.fileSize || '0'),
        contentType: response.ContentType || '',
        uploadedBy: metadata.uploadedBy || '',
        projectId: metadata.projectId || undefined,
        environment: (metadata.environment as 'dev' | 'prod') || 'dev',
        uploadedAt: new Date(metadata.uploadedAt || Date.now()),
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      return null
    }
  }
}
