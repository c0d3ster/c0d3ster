import { services } from '@/services'

const { fileService, projectService, userService } = services

export const FileResolver = {
  Query: {
    files: async (_: any, { filter }: { filter?: any }) => {
      let prefix = ''
      if (filter?.projectId) {
        prefix = `*/projects/${filter.projectId}/*`
      } else if (filter?.userId) {
        prefix = `*/users/${filter.userId}/*`
      }

      // Get list of file keys
      const fileKeys = await fileService.listFiles(prefix)

      // Get metadata for each file
      const fileMetadata = await Promise.all(
        fileKeys.map((key: string) => fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },

    file: async (_: any, { key }: { key: string }) => {
      return await fileService.getFileMetadata(key)
    },

    projectFiles: async (_: any, { projectId }: { projectId: string }) => {
      // Get project files from database instead of S3
      return await fileService.getProjectFiles(projectId)
    },

    userFiles: async (_: any, { userId }: { userId: string }) => {
      const files = await fileService.listFiles(`*/users/${userId}/*`)

      // Get metadata for each file
      const fileMetadata = await Promise.all(
        files.map((key: string) => fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },
  },

  Mutation: {
    // New mutation for project logo uploads that handles the complete flow
    uploadProjectLogo: async (
      _: any,
      { projectId, input }: { projectId: string; input: any },
      context: any
    ) => {
      // In a real app, you'd get userId from context
      const userId = context.userId || 'temp-user-id'

      // Generate the upload URL
      const result = await fileService.generatePresignedUploadUrl({
        fileName: input.fileName,
        originalFileName: input.originalFileName,
        fileSize: input.fileSize,
        contentType: input.contentType,
        userId,
        projectId,
        environment: input.environment || 'DEV',
      })

      // Get the current user to check permissions
      const currentUser = await userService.getCurrentUserWithAuth()

      // Update the project logo field - this will automatically create the project_files entry
      await projectService.updateProject(
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
      return await fileService.generatePresignedDownloadUrl(key)
    },

    deleteFile: async (_: any, { key }: { key: string }, context: any) => {
      // In a real app, you'd get userId from context and check permissions
      const userId = context.userId || 'temp-user-id'

      const metadata = await fileService.getFileMetadata(key)

      if (!metadata || metadata.uploadedBy !== userId) {
        throw new Error('Access denied')
      }

      await fileService.deleteFile(key)
      return true
    },
  },

  File: {
    id: (parent: any) => parent.key,
    uploadedBy: async (parent: any) => {
      return await userService.getUserById(parent.uploadedBy)
    },
    project: async (parent: any) => {
      if (!parent.projectId) return null
      return await projectService.getProjectById(parent.projectId)
    },
    downloadUrl: async (parent: any) => {
      return await fileService.generatePresignedDownloadUrl(parent.key)
    },
  },
}
