import type { FileService, ProjectService, UserService } from '@/services'

export class FileResolver {
  [key: string]: any

  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private userService: UserService
  ) {}

  Query = {
    files: async (_: any, { filter }: { filter?: any }) => {
      let prefix = ''
      if (filter?.projectId) {
        prefix = `*/projects/${filter.projectId}/*`
      } else if (filter?.userId) {
        prefix = `*/users/${filter.userId}/*`
      }

      // Get list of file keys
      const fileKeys = await this.fileService.listFiles(prefix)

      // Get metadata for each file
      const fileMetadata = await Promise.all(
        fileKeys.map((key: string) => this.fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },

    file: async (_: any, { key }: { key: string }) => {
      return await this.fileService.getFileMetadata(key)
    },

    projectFiles: async (_: any, { projectId }: { projectId: string }) => {
      // Get project files from database instead of S3
      return await this.fileService.getProjectFiles(projectId)
    },

    userFiles: async (_: any, { userId }: { userId: string }) => {
      const files = await this.fileService.listFiles(`*/users/${userId}/*`)

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
      context: any
    ) => {
      // In a real app, you'd get userId from context
      const userId = context.userId || 'temp-user-id'

      // Generate the upload URL
      const result = await this.fileService.generatePresignedUploadUrl({
        fileName: input.fileName,
        originalFileName: input.originalFileName,
        fileSize: input.fileSize,
        contentType: input.contentType,
        userId,
        projectId,
        environment: input.environment || 'DEV',
      })

      // Get the current user to check permissions
      const currentUser = await this.userService.getCurrentUserWithAuth()

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

    generateFileDownloadUrl: async (_: any, { key }: { key: string }) => {
      return await this.fileService.generatePresignedDownloadUrl(key)
    },

    deleteFile: async (_: any, { key }: { key: string }, context: any) => {
      // In a real app, you'd get userId from context and check permissions
      const userId = context.userId || 'temp-user-id'

      const metadata = await this.fileService.getFileMetadata(key)

      if (!metadata || metadata.uploadedBy !== userId) {
        throw new Error('Access denied')
      }

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
    downloadUrl: async (parent: any) => {
      return await this.fileService.generatePresignedDownloadUrl(parent.key)
    },
  }
}
