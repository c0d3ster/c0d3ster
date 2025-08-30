import type { FileService, ProjectService, UserService } from '@/services'

export class FileResolver {
  [key: string]: any

  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private userService: UserService
  ) {}

  Query = {
    files: async (_: any, { filter }: { filter?: any }, _context: any) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      const env = filter?.environment ?? 'DEV'
      let prefix = ''
      if (filter?.projectId) {
        prefix = `${env.toLowerCase()}/projects/${filter.projectId}/`
      } else if (filter?.userId) {
        // Only allow users to list their own files, or admins to list any user's files
        if (
          filter.userId !== currentUser.id &&
          currentUser.role !== 'admin' &&
          currentUser.role !== 'super_admin'
        ) {
          throw new Error('Access denied: You can only list your own files')
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
    },

    file: async (_: any, { key }: { key: string }, _context: any) => {
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
        currentUser.role === 'admin' ||
        currentUser.role === 'super_admin'

      if (!canAccess) throw new Error('Access denied')
      return meta
    },

    projectFiles: async (
      _: any,
      { projectId }: { projectId: string },
      _context: any
    ) => {
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
    },

    userFiles: async (
      _: any,
      { userId }: { userId: string },
      _context: any
    ) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()

      // Only allow users to list their own files, or admins to list any user's files
      if (
        userId !== currentUser.id &&
        currentUser.role !== 'admin' &&
        currentUser.role !== 'super_admin'
      ) {
        throw new Error('Access denied: You can only list your own files')
      }

      const env = 'DEV' // or derive from context/filter
      const files = await this.fileService.listFiles(
        `${env.toLowerCase()}/users/${userId}/`
      )

      // Get metadata for each file
      const fileMetadata = await Promise.all(
        files.map((key: string) => this.fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },
  }

  Mutation = {
    // New mutation for project logo uploads that handles the complete flow
    uploadProjectLogo: async (
      _: any,
      { projectId, input }: { projectId: string; input: any },
      _context: any
    ) => {
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

      if (
        !allowedTypes.includes(input.contentType) ||
        input.fileSize > maxSize
      ) {
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
        environment: input.environment || 'DEV',
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
    },

    generateFileDownloadUrl: async (
      _: any,
      { key }: { key: string },
      _context: any
    ) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      const meta = await this.fileService.getFileMetadata(key)
      if (!meta) throw new Error('Not found')

      const canAccess =
        meta.uploadedBy === currentUser.id ||
        (meta.projectId &&
          (await this.projectService.getProjectById(
            meta.projectId,
            currentUser.id,
            currentUser.role
          ))) ||
        currentUser.role === 'admin' ||
        currentUser.role === 'super_admin'

      if (!canAccess) throw new Error('Access denied')
      return await this.fileService.generatePresignedDownloadUrl(key)
    },

    deleteFile: async (_: any, { key }: { key: string }, _context: any) => {
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
        currentUser.role === 'admin' ||
        currentUser.role === 'super_admin'

      if (!canDelete) throw new Error('Access denied')

      await this.fileService.deleteFile(key)
      return true
    },
  }

  File = {
    id: (parent: any) => parent.key,
    uploadedBy: async (parent: any) => {
      return await this.userService.getUserById(parent.uploadedBy)
    },
    project: async (parent: any) => {
      if (!parent.projectId) return null
      return await this.projectService.getProjectById(parent.projectId)
    },
    downloadUrl: async (parent: any, _args: any, _context: any) => {
      const currentUser = await this.userService.getCurrentUserWithAuth()
      const canAccess =
        parent.uploadedBy === currentUser.id ||
        (parent.projectId &&
          (await this.projectService.getProjectById(
            parent.projectId,
            currentUser.id,
            currentUser.role
          ))) ||
        currentUser.role === 'admin' ||
        currentUser.role === 'super_admin'

      if (!canAccess) throw new Error('Access denied')
      return await this.fileService.generatePresignedDownloadUrl(parent.key)
    },
  }
}
