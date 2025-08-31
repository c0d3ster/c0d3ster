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

import {
  Environment,
  File,
  FileFilterInput,
  FileUploadInput,
  ProjectLogoUploadResult, 
UserRole 
} from '@/graphql/schema'

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

  @Mutation(() => ProjectLogoUploadResult)
  async uploadProjectLogo(
    @Arg('projectId', () => ID) projectId: string,
    @Arg('input', () => FileUploadInput) input: FileUploadInput
  ) {
    const currentUser = await this.userService.getCurrentUserWithAuth()

    // Ensure user can update this project before issuing upload URL
    const project = await this.projectService.getProjectById(
      projectId,
      currentUser.id,
      currentUser.role
    )
    if (!project) {
      throw new Error('Project not found or access denied')
    }

    // Validate upload input (content type and size)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(input.contentType) || input.fileSize > maxSize) {
      throw new Error('Invalid file upload parameters')
    }

    // Generate the upload URL
    const result = await this.fileService.generatePresignedUploadUrl({
      fileName: input.fileName,
      originalFileName: input.originalFileName,
      fileSize: input.fileSize,
      contentType: input.contentType,
      userId: currentUser.id,
      projectId,
      environment: input.environment,
    })

    // Update the project logo field - this will automatically create the project_files entry
    await this.projectService.updateProject(
      projectId,
      { logo: result.key },
      currentUser.id,
      currentUser.role
    )

    return {
      uploadUrl: result.uploadUrl,
      key: result.key,
      metadata: result.metadata,
      projectId,
    }
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
