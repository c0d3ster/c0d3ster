import type { Buffer } from 'node:buffer'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { eq } from 'drizzle-orm'

import type { FileUploadInput } from '@/graphql/schema'

import { Environment } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'

export class FileService {
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    // Validate R2 environment variables at runtime
    if (
      !Env.R2_ACCOUNT_ID ||
      !Env.R2_ACCESS_KEY_ID ||
      !Env.R2_SECRET_ACCESS_KEY ||
      !Env.R2_BUCKET_NAME
    ) {
      throw new Error(
        'R2 environment variables are required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME'
      )
    }

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

  private generateKey(options: FileUploadInput & { userId: string }): string {
    const timestamp = Date.now()
    const sanitizedFileName = options.fileName.replace(/[^a-z0-9.-]/gi, '_')
    const env = options.environment || Environment.DEV

    if (options.projectId) {
      return `${env.toLowerCase()}/projects/${options.projectId}/${timestamp}_${sanitizedFileName}`
    }

    return `${env.toLowerCase()}/users/${options.userId}/${timestamp}_${sanitizedFileName}`
  }

  async generatePresignedUploadUrl(
    options: FileUploadInput & { userId: string }
  ): Promise<{
    uploadUrl: string
    key: string
    metadata: {
      key: string
      fileName: string
      originalFileName: string
      fileSize: number
      contentType: string
      uploadedBy: string
      projectId?: string
      environment: Environment
      uploadedAt: Date
    }
  }> {
    const key = this.generateKey(options)
    const metadata = {
      key,
      fileName: options.fileName,
      originalFileName: options.originalFileName,
      fileSize: options.fileSize,
      contentType: options.contentType,
      uploadedBy: options.userId,
      projectId: options.projectId || undefined,
      environment: options.environment || Environment.DEV,
      uploadedAt: new Date(),
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: options.contentType,
      Metadata: {
        // Use lowercase keys to match how S3/R2 returns metadata
        filename: options.fileName,
        originalfilename: options.originalFileName,
        filesize: options.fileSize.toString(),
        uploadedby: options.userId,
        projectid: options.projectId || '',
        environment: options.environment || Environment.DEV,
        uploadedat: new Date().toISOString(),
      },
    })

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900, // 15 minutes
    })

    return {
      uploadUrl,
      key,
      metadata,
    }
  }

  // Enhanced method for project file uploads that creates database record
  async generateProjectFileUploadUrl(
    options: FileUploadInput & {
      userId: string
      isClientVisible?: boolean
      description?: string
    }
  ) {
    const result = await this.generatePresignedUploadUrl(options)

    // If this is a project file, create the database record
    if (options.projectId) {
      await this.createProjectFileRecord({
        projectId: options.projectId,
        fileName: options.fileName,
        originalFileName: options.originalFileName,
        contentType: options.contentType,
        fileSize: options.fileSize,
        filePath: result.key, // Use the S3 key as the file path
        uploadedBy: options.userId,
        isClientVisible: options.isClientVisible ?? true,
        description: options.description,
      })
    }

    return result
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

  async uploadFile(
    key: string,
    fileBuffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
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

  async getFileMetadata(key: string): Promise<{
    key: string
    fileName: string
    originalFileName: string
    fileSize: number
    contentType: string
    uploadedBy: string
    projectId?: string
    environment: Environment
    uploadedAt: Date
  } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const response = await this.s3Client.send(command)
      const meta = Object.fromEntries(
        Object.entries(response.Metadata ?? {}).map(([k, v]) => [
          k.toLowerCase(),
          v,
        ])
      ) as Record<string, string>
      const inferredFileName =
        key.split('/').pop()?.split('_').slice(1).join('_') ?? ''

      return {
        key,
        fileName: meta.filename || inferredFileName,
        originalFileName: meta.originalfilename || inferredFileName,
        fileSize: Number.parseInt(meta.filesize || '0', 10),
        contentType: response.ContentType || '',
        uploadedBy: meta.uploadedby || '',
        projectId: meta.projectid || undefined,
        environment: (meta.environment as Environment) || Environment.DEV,
        uploadedAt: new Date(meta.uploadedat || Date.now()),
      }
    } catch (error) {
      logger.error('Error getting file metadata:', { error })
      return null
    }
  }

  // Database operations for project files
  async createProjectFileRecord(options: {
    projectId: string
    fileName: string
    originalFileName: string
    contentType: string
    fileSize?: number
    filePath: string
    uploadedBy: string
    isClientVisible?: boolean
    description?: string
  }) {
    const [projectFile] = await db
      .insert(schemas.projectFiles)
      .values({
        projectId: options.projectId,
        fileName: options.fileName,
        originalFileName: options.originalFileName,
        contentType: options.contentType,
        fileSize: options.fileSize,
        filePath: options.filePath,
        uploadedBy: options.uploadedBy,
        isClientVisible: options.isClientVisible ?? true,
        description: options.description,
      })
      .returning()

    return projectFile
  }

  async deleteProjectFileRecordByPath(filePath: string) {
    const result = await db
      .delete(schemas.projectFiles)
      .where(eq(schemas.projectFiles.filePath, filePath))
      .returning()

    logger.info(`Deleted project file record for path: ${filePath}`, {
      deletedCount: result.length,
    })
    return result
  }

  async getProjectFiles(projectId: string) {
    return await db.query.projectFiles.findMany({
      where: eq(schemas.projectFiles.projectId, projectId),
    })
  }

  async deleteProjectFileRecord(projectFileId: string) {
    await db
      .delete(schemas.projectFiles)
      .where(eq(schemas.projectFiles.id, projectFileId))
  }
}
