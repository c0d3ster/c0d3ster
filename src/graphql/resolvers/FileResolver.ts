import { fileTypeFromBuffer } from 'file-type'
import {
  Arg,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'

import type { Environment } from '@/graphql/schema'
import type { ProjectFileRecord } from '@/models'
import type { FileService, ProjectService, UserService } from '@/services'

import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/constants/file'
import {
  File,
  FileFilterInput,
  FilePlacement,
  ProjectFileUploadResult,
  ProjectLogoUploadResult,
  UserRole,
} from '@/graphql/schema'
import { logger } from '@/libs/Logger'
import {
  isAllowedImageContentType,
  isAllowedProjectFileContentType,
  normalizeImageContentType,
  normalizeProjectFileContentType,
} from '@/utils/File'

// environment is passed in (derived from the bucket via FileService.resolveEnvironment())
// rather than from the key, since keys no longer carry an env prefix.
const toFileType = (record: ProjectFileRecord, environment: Environment): File => ({
  id: record.id,
  key: record.filePath,
  fileName: record.fileName,
  originalFileName: record.originalFileName,
  fileSize: record.fileSize ?? 0,
  contentType: record.contentType,
  uploadedById: record.uploadedBy,
  projectId: record.projectId,
  uploadedBy: record.uploadedBy,
  environment,
  uploadedAt: record.createdAt.toISOString(),
  caption: record.caption ?? undefined,
  placement: (record.placement as FilePlacement) ?? undefined,
})

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
    let prefix = ''
    if (filter?.projectId) {
      prefix = `projects/${filter.projectId}/`
    } else if (filter?.userId) {
      // Only allow users to list their own files, or admins to list any user's files
      if (filter.userId !== currentUser.id) {
        this.userService.checkPermission(currentUser, UserRole.Admin)
      }
      prefix = `users/${filter.userId}/`
    }

    // Get list of file keys
    const fileKeys = await this.fileService.listFiles(prefix)

    // Get metadata for each file
    const fileMetadata = await Promise.all(
      fileKeys.map((key: string) => this.fileService.getFileMetadata(key))
    )

    const results = fileMetadata.filter(
      (file): file is NonNullable<typeof file> => file !== null
    )
    // The bucket is already environment-scoped, so this only matters if a
    // caller explicitly wants to cross-check recorded upload metadata.
    if (filter?.environment) {
      return results.filter((file) => file.environment === filter.environment)
    }
    return results
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
    const projectFiles = await this.fileService.getProjectFiles(projectId)
    const environment = this.fileService.resolveEnvironment()
    return projectFiles.map((record) => toFileType(record, environment))
  }

  @Query(() => [File])
  async userFiles(@Arg('userId', () => ID) userId: string) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    // Only allow users to list their own files, or admins to list any user's files
    if (userId !== currentUser.id) {
      this.userService.checkPermission(currentUser, UserRole.Admin)
    }

    const files = await this.fileService.listFiles(`users/${userId}/`)

    // Get metadata for each file
    const fileMetadata = await Promise.all(
      files.map((key: string) => this.fileService.getFileMetadata(key))
    )

    return fileMetadata.filter(Boolean)
  }

  /**
   * Step 1: Returns a presigned PUT URL so the browser uploads directly to R2
   * (GraphQL request stays small; avoids Vercel 4.5MB body limit).
   */
  @Mutation(() => ProjectLogoUploadResult)
  async requestProjectLogoUpload(
    @Arg('projectId', () => ID) projectId: string,
    @Arg('fileName', () => String) fileName: string,
    @Arg('contentType', () => String) contentType: string,
    @Arg('fileSize', () => Int) fileSize: number
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    const project = await this.projectService.getProjectById(
      projectId,
      currentUser.id,
      currentUser.role
    )
    if (!project) {
      throw new Error('Project not found or access denied')
    }

    const trimmedName = fileName.trim()
    if (!trimmedName) {
      throw new Error('Invalid file upload parameters. File name is required.')
    }

    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `Invalid file upload parameters. File size: ${fileSize}, Max size: ${MAX_FILE_SIZE}`
      )
    }

    if (!isAllowedImageContentType(contentType)) {
      throw new Error(
        `Invalid file upload parameters. Content type: ${contentType} is not allowed`
      )
    }

    const normalizedType = normalizeImageContentType(contentType)
    const result = await this.fileService.generateProjectLogoPresignedUpload({
      projectId,
      userId: currentUser.id,
      fileName: trimmedName,
      originalFileName: trimmedName,
      fileSize,
      contentType: normalizedType,
    })

    return {
      uploadUrl: result.uploadUrl,
      key: result.key,
      metadata: {
        key: result.metadata.key,
        fileName: result.metadata.fileName,
        originalFileName: result.metadata.originalFileName,
        fileSize: result.metadata.fileSize,
        contentType: result.metadata.contentType,
        environment: result.metadata.environment,
        uploadedAt: result.metadata.uploadedAt,
      },
      projectId,
    }
  }

  /**
   * Step 2: After the client PUTs the file to R2, call this to validate the object,
   * update the project, and return a presigned download URL.
   */
  @Mutation(() => String)
  async finalizeProjectLogoUpload(
    @Arg('projectId', () => ID) projectId: string,
    @Arg('key', () => String) key: string
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    const project = await this.projectService.getProjectById(
      projectId,
      currentUser.id,
      currentUser.role
    )
    if (!project) {
      throw new Error('Project not found or access denied')
    }

    const expectedPrefix = `projects/${projectId}/`
    if (!key.startsWith(expectedPrefix)) {
      throw new Error('Invalid logo key')
    }
    if (key.split('/').includes('..')) {
      throw new Error('Invalid logo key')
    }

    const head = await this.fileService.getObjectHeadInfo(key)
    if (!head || head.contentLength <= 0) {
      throw new Error('Uploaded file not found or empty')
    }

    if (head.contentLength > MAX_FILE_SIZE) {
      throw new Error(
        `Invalid file upload parameters. File size: ${head.contentLength}, Max size: ${MAX_FILE_SIZE}`
      )
    }

    const buffer = await this.fileService.getObjectBufferRange(key, 16_384)
    if (!buffer?.length) {
      throw new Error('Could not read uploaded file for validation')
    }

    const detected = await fileTypeFromBuffer(buffer)
    const effectiveType = detected?.mime
      ? normalizeImageContentType(detected.mime)
      : normalizeImageContentType(head.contentType)

    logger.info('Logo finalize validation:', {
      effectiveType,
      fileSize: head.contentLength,
      allowedTypes: ALLOWED_IMAGE_TYPES,
      maxSize: MAX_FILE_SIZE,
    })

    if (!isAllowedImageContentType(effectiveType)) {
      throw new Error(
        `Invalid file upload parameters. Content type: ${effectiveType}, File size: ${head.contentLength}, Max size: ${MAX_FILE_SIZE}`
      )
    }

    const meta = await this.fileService.getFileMetadata(key)
    if (!meta) {
      throw new Error('Could not read uploaded file metadata')
    }

    const oldLogoKey = project.logo

    await this.projectService.updateProject(
      projectId,
      { logo: key },
      currentUser.id,
      currentUser.role
    )

    await this.fileService.createProjectFileRecord({
      projectId,
      fileName: meta.fileName,
      originalFileName: meta.originalFileName,
      contentType: effectiveType,
      fileSize: head.contentLength,
      filePath: key,
      uploadedBy: currentUser.id,
      isClientVisible: true,
      description: 'Project logo',
    })

    if (
      oldLogoKey &&
      oldLogoKey !== key &&
      (oldLogoKey.includes('projects/') || oldLogoKey.includes('users/'))
    ) {
      try {
        await this.fileService.deleteFile(oldLogoKey)
        logger.info(`Deleted old logo file: ${oldLogoKey}`)
        await this.fileService.deleteProjectFileRecordByPath(oldLogoKey)
        logger.info(`Deleted old logo database entry: ${oldLogoKey}`)
      } catch (error) {
        logger.warn(`Failed to clean up old logo: ${oldLogoKey}`, {
          error: String(error),
        })
      }
    }

    return await this.fileService.generatePresignedDownloadUrl(key)
  }

  /**
   * Step 1: Returns a presigned PUT URL for an arbitrary project file (gallery image,
   * document, etc.) - same 2-step flow as the logo upload, but any allowed content type.
   */
  @Mutation(() => ProjectFileUploadResult)
  async requestProjectFileUpload(
    @Arg('projectId', () => ID) projectId: string,
    @Arg('fileName', () => String) fileName: string,
    @Arg('contentType', () => String) contentType: string,
    @Arg('fileSize', () => Int) fileSize: number
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    const project = await this.projectService.getProjectById(
      projectId,
      currentUser.id,
      currentUser.role
    )
    if (!project) {
      throw new Error('Project not found or access denied')
    }

    const trimmedName = fileName.trim()
    if (!trimmedName) {
      throw new Error('Invalid file upload parameters. File name is required.')
    }

    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `Invalid file upload parameters. File size: ${fileSize}, Max size: ${MAX_FILE_SIZE}`
      )
    }

    if (!isAllowedProjectFileContentType(contentType)) {
      throw new Error(
        `Invalid file upload parameters. Content type: ${contentType} is not allowed`
      )
    }

    const normalizedType = normalizeProjectFileContentType(contentType)
    const result = await this.fileService.generateProjectFilePresignedUpload({
      projectId,
      userId: currentUser.id,
      fileName: trimmedName,
      originalFileName: trimmedName,
      fileSize,
      contentType: normalizedType,
    })

    return {
      uploadUrl: result.uploadUrl,
      key: result.key,
      metadata: {
        key: result.metadata.key,
        fileName: result.metadata.fileName,
        originalFileName: result.metadata.originalFileName,
        fileSize: result.metadata.fileSize,
        contentType: result.metadata.contentType,
        environment: result.metadata.environment,
        uploadedAt: result.metadata.uploadedAt,
      },
      projectId,
    }
  }

  /**
   * Step 2: After the client PUTs the file to R2, call this to validate the object and
   * persist the project file record (with optional caption/placement).
   */
  @Mutation(() => File)
  async finalizeProjectFileUpload(
    @Arg('projectId', () => ID) projectId: string,
    @Arg('key', () => String) key: string,
    @Arg('caption', () => String, { nullable: true }) caption?: string,
    @Arg('placement', () => FilePlacement, { nullable: true })
    placement?: FilePlacement
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    const project = await this.projectService.getProjectById(
      projectId,
      currentUser.id,
      currentUser.role
    )
    if (!project) {
      throw new Error('Project not found or access denied')
    }

    const expectedPrefix = `projects/${projectId}/`
    if (!key.startsWith(expectedPrefix)) {
      throw new Error('Invalid file key')
    }
    if (key.split('/').includes('..')) {
      throw new Error('Invalid file key')
    }

    const head = await this.fileService.getObjectHeadInfo(key)
    if (!head || head.contentLength <= 0) {
      throw new Error('Uploaded file not found or empty')
    }

    if (head.contentLength > MAX_FILE_SIZE) {
      throw new Error(
        `Invalid file upload parameters. File size: ${head.contentLength}, Max size: ${MAX_FILE_SIZE}`
      )
    }

    const buffer = await this.fileService.getObjectBufferRange(key, 16_384)
    if (!buffer?.length) {
      throw new Error('Could not read uploaded file for validation')
    }

    const detected = await fileTypeFromBuffer(buffer)
    const effectiveType = detected?.mime
      ? normalizeProjectFileContentType(detected.mime)
      : normalizeProjectFileContentType(head.contentType)

    if (!isAllowedProjectFileContentType(effectiveType)) {
      throw new Error(
        `Invalid file upload parameters. Content type: ${effectiveType}, File size: ${head.contentLength}, Max size: ${MAX_FILE_SIZE}`
      )
    }

    const meta = await this.fileService.getFileMetadata(key)
    if (!meta) {
      throw new Error('Could not read uploaded file metadata')
    }

    const projectFile = await this.fileService.createProjectFileRecord({
      projectId,
      fileName: meta.fileName,
      originalFileName: meta.originalFileName,
      contentType: effectiveType,
      fileSize: head.contentLength,
      filePath: key,
      uploadedBy: currentUser.id,
      isClientVisible: true,
      caption,
      placement,
    })

    if (!projectFile) {
      throw new Error('Failed to save uploaded file record')
    }

    return toFileType(projectFile, this.fileService.resolveEnvironment())
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
