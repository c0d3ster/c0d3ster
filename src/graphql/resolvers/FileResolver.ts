import { Buffer } from 'node:buffer'
import {
  Arg,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'

import type { FileService, ProjectService, UserService } from '@/services'

import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/constants/file'
import { Environment, File, FileFilterInput, UserRole } from '@/graphql/schema'
import { logger } from '@/libs/Logger'

@Resolver(() => File)
export class FileResolver {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private userService: UserService
  ) {}

  @Query(() => [File])
  async files(
    @Arg('filter', () => FileFilterInput, { nullable: true })
    filter?: FileFilterInput
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    const env = filter?.environment ?? Environment.DEV
    let prefix = ''
    if (filter?.projectId) {
      prefix = `${env.toLowerCase()}/projects/${filter.projectId}/`
    } else if (filter?.userId) {
      // Only allow users to list their own files, or admins to list any user's files
      if (filter.userId !== currentUser.id) {
        this.userService.checkPermission(currentUser, UserRole.Admin)
      }
      prefix = `${env.toLowerCase()}/users/${filter.userId}/`
    }

    // Get list of file keys
    const fileKeys = await this.fileService.listFiles(prefix)

    // Get metadata for each file
    const fileMetadata = await Promise.all(
      fileKeys.map((key: string) => this.fileService.getFileMetadata(key))
    )

    return fileMetadata.filter(Boolean)
  }

  @Query(() => File, { nullable: true })
  async file(@Arg('key', () => String) key: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()
    const meta = await this.fileService.getFileMetadata(key)
    if (!meta) return null

    // Allow access if user uploaded the file, has project access, or is admin
    const canAccess =
      meta.uploadedBy === currentUser.id ||
      (meta.projectId &&
        (await this.projectService.getProjectById(
          meta.projectId,
          currentUser.id,
          currentUser.role
        ))) ||
      (() => {
        try {
          this.userService.checkPermission(currentUser, UserRole.Admin)
          return true
        } catch {
          return false
        }
      })()

    if (!canAccess) throw new Error('Access denied')
    return meta
  }

  @Query(() => [File])
  async projectFiles(@Arg('projectId', () => ID) projectId: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    // Check if user has access to this project
    const project = await this.projectService.getProjectById(
      projectId,
      currentUser.id,
      currentUser.role
    )
    if (!project) {
      throw new Error('Project not found or access denied')
    }

    // Get project files from database instead of S3
    return await this.fileService.getProjectFiles(projectId)
  }

  @Query(() => [File])
  async userFiles(@Arg('userId', () => ID) userId: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    // Only allow users to list their own files, or admins to list any user's files
    if (userId !== currentUser.id) {
      this.userService.checkPermission(currentUser, UserRole.Admin)
    }

    const env = Environment.DEV // or derive from context/filter
    const files = await this.fileService.listFiles(
      `${env.toLowerCase()}/users/${userId}/`
    )

    // Get metadata for each file
    const fileMetadata = await Promise.all(
      files.map((key: string) => this.fileService.getFileMetadata(key))
    )

    return fileMetadata.filter(Boolean)
  }

  @Mutation(() => String)
  async uploadProjectLogo(
    @Arg('projectId', () => ID) projectId: string,
    @Arg('file', () => String) fileBase64: string,
    @Arg('fileName', () => String) fileName: string,
    @Arg('contentType', () => String) contentType: string
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    // Ensure user can update this project
    const project = await this.projectService.getProjectById(
      projectId,
      currentUser.id,
      currentUser.role
    )
    if (!project) {
      throw new Error('Project not found or access denied')
    }

    // Decode base64 to get file size
    const fileBuffer = Buffer.from(fileBase64, 'base64')
    const fileSize = fileBuffer.length

    logger.info('Upload validation:', {
      contentType,
      fileSize,
      fileName,
      allowedTypes: ALLOWED_IMAGE_TYPES,
      maxSize: MAX_FILE_SIZE,
    })

    if (
      !ALLOWED_IMAGE_TYPES.includes(contentType as any) ||
      fileSize > MAX_FILE_SIZE
    ) {
      throw new Error(
        `Invalid file upload parameters. Content type: ${contentType}, File size: ${fileSize}, Max size: ${MAX_FILE_SIZE}`
      )
    }

    // Get current project logo before updating
    const oldLogoKey = project.logo

    // Generate file key with environment prefix
    const timestamp = Date.now()
    const key = `dev/projects/${projectId}/${timestamp}_${fileName}`

    // Upload directly to R2/S3
    await this.fileService.uploadFile(key, fileBuffer, contentType)

    // Update project logo field
    await this.projectService.updateProject(
      projectId,
      { logo: key },
      currentUser.id,
      currentUser.role
    )

    // Create project_files entry for new logo
    await this.fileService.createProjectFileRecord({
      projectId,
      fileName,
      originalFileName: fileName,
      contentType,
      fileSize,
      filePath: key,
      uploadedBy: currentUser.id,
      isClientVisible: true,
      description: 'Project logo',
    })

    // Clean up old logo AFTER successful upload and database updates
    if (oldLogoKey && oldLogoKey.includes('projects/')) {
      try {
        // Delete old logo file from storage
        await this.fileService.deleteFile(oldLogoKey)
        logger.info(`Deleted old logo file: ${oldLogoKey}`)

        // Delete old logo entry from project_files table
        await this.fileService.deleteProjectFileRecord(oldLogoKey)
        logger.info(`Deleted old logo database entry: ${oldLogoKey}`)
      } catch (error) {
        logger.warn(`Failed to clean up old logo: ${oldLogoKey}`, {
          error: String(error),
        })
        // Don't throw - cleanup failure shouldn't affect the successful upload
      }
    }

    // Generate and return presigned URL for the new logo
    const presignedUrl =
      await this.fileService.generatePresignedDownloadUrl(key)
    return presignedUrl
  }

  @Mutation(() => Boolean)
  async deleteFile(@Arg('key', () => String) key: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    const metadata = await this.fileService.getFileMetadata(key)

    if (!metadata) throw new Error('Not found')

    const canDelete =
      metadata.uploadedBy === currentUser.id ||
      (metadata.projectId &&
        (await this.projectService.getProjectById(
          metadata.projectId,
          currentUser.id,
          currentUser.role
        ))) ||
      (() => {
        try {
          this.userService.checkPermission(currentUser, UserRole.Admin)
          return true
        } catch {
          return false
        }
      })()

    if (!canDelete) throw new Error('Access denied')

    await this.fileService.deleteFile(key)
    return true
  }

  @FieldResolver(() => String)
  async downloadUrl(@Root() file: File) {
    // If it's an assets path, return the key as-is (no signed URL needed)
    if (file.key.startsWith('/assets/')) {
      return file.key
    }

    const currentUser = await this.userService.getCurrentUserWithAuth()
    const canAccess =
      file.uploadedBy === currentUser.id ||
      (file.projectId &&
        (await this.projectService.getProjectById(
          file.projectId,
          currentUser.id,
          currentUser.role
        ))) ||
      (() => {
        try {
          this.userService.checkPermission(currentUser, UserRole.Admin)
          return true
        } catch {
          return false
        }
      })()

    if (!canAccess) throw new Error('Access denied')
    return await this.fileService.generatePresignedDownloadUrl(file.key)
  }
}
