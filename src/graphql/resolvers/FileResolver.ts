import { FileService } from '@/services/FileService'
import { ProjectService } from '@/services/ProjectService'
import { UserService } from '@/services/UserService'

export const FileResolver = {
  Query: {
    files: async (_: any, { filter }: { filter?: any }) => {
      const fileService = new FileService()

      if (filter?.projectId) {
        return await fileService.listFiles(`*/projects/${filter.projectId}/*`)
      }

      if (filter?.userId) {
        return await fileService.listFiles(`*/users/${filter.userId}/*`)
      }

      // Return all files (with pagination in production)
      return await fileService.listFiles('')
    },

    file: async (_: any, { key }: { key: string }) => {
      const fileService = new FileService()
      return await fileService.getFileMetadata(key)
    },

    projectFiles: async (_: any, { projectId }: { projectId: string }) => {
      const fileService = new FileService()
      const files = await fileService.listFiles(`*/projects/${projectId}/*`)

      // Get metadata for each file
      const fileMetadata = await Promise.all(
        files.map((key) => fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },

    userFiles: async (_: any, { userId }: { userId: string }) => {
      const fileService = new FileService()
      const files = await fileService.listFiles(`*/users/${userId}/*`)

      // Get metadata for each file
      const fileMetadata = await Promise.all(
        files.map((key) => fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },
  },

  Mutation: {
    generateFileUploadUrl: async (
      _: any,
      { input }: { input: any },
      context: any
    ) => {
      // In a real app, you'd get userId from context
      const userId = context.userId || 'temp-user-id'

      const fileService = new FileService()

      const result = await fileService.generatePresignedUploadUrl({
        fileName: input.fileName,
        originalFileName: input.originalFileName,
        fileType: input.fileType.toLowerCase(),
        fileSize: input.fileSize,
        contentType: input.contentType,
        userId,
        projectId: input.projectId,
        environment: input.environment?.toLowerCase() || 'dev',
      })

      return {
        uploadUrl: result.uploadUrl,
        key: result.key,
        metadata: result.metadata,
      }
    },

    deleteFile: async (_: any, { key }: { key: string }, context: any) => {
      // In a real app, you'd get userId from context and check permissions
      const userId = context.userId || 'temp-user-id'

      const fileService = new FileService()
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
      const userService = new UserService()
      return await userService.getUserById(parent.uploadedBy)
    },
    project: async (parent: any) => {
      if (!parent.projectId) return null
      const projectService = new ProjectService()
      return await projectService.getProjectById(parent.projectId)
    },
    downloadUrl: async (parent: any) => {
      const fileService = new FileService()
      return await fileService.generatePresignedDownloadUrl(parent.key)
    },
  },

  Project: {
    files: async (parent: any) => {
      const fileService = new FileService()
      const files = await fileService.listFiles(`*/projects/${parent.id}/*`)

      const fileMetadata = await Promise.all(
        files.map((key) => fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },
  },

  User: {
    files: async (parent: any) => {
      const fileService = new FileService()
      const files = await fileService.listFiles(`*/users/${parent.id}/*`)

      const fileMetadata = await Promise.all(
        files.map((key) => fileService.getFileMetadata(key))
      )

      return fileMetadata.filter(Boolean)
    },
  },
}
