import { useMutation, useQuery } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  DeleteFileMutation,
  DeleteFileMutationVariables,
  FileFilterInput,
  FilePlacement,
  FinalizeProjectFileUploadMutation,
  FinalizeProjectFileUploadMutationVariables,
  FinalizeProjectLogoUploadMutation,
  FinalizeProjectLogoUploadMutationVariables,
  GetFileQuery,
  GetFileQueryVariables,
  GetProjectFilesQuery,
  GetProjectFilesQueryVariables,
  RequestProjectFileUploadMutation,
  RequestProjectFileUploadMutationVariables,
  RequestProjectLogoUploadMutation,
  RequestProjectLogoUploadMutationVariables,
} from '@/graphql/generated/graphql'

import { apolloClient } from '@/libs/ApolloClient'
import { isPublicUrl } from '@/utils'

export const REQUEST_PROJECT_LOGO_UPLOAD = gql`
  mutation RequestProjectLogoUpload(
    $projectId: ID!
    $fileName: String!
    $contentType: String!
    $fileSize: Int!
  ) {
    requestProjectLogoUpload(
      projectId: $projectId
      fileName: $fileName
      contentType: $contentType
      fileSize: $fileSize
    ) {
      uploadUrl
      key
      projectId
      metadata {
        key
        fileName
        originalFileName
        fileSize
        contentType
        environment
        uploadedAt
      }
    }
  }
`

export const FINALIZE_PROJECT_LOGO_UPLOAD = gql`
  mutation FinalizeProjectLogoUpload($projectId: ID!, $key: String!) {
    finalizeProjectLogoUpload(projectId: $projectId, key: $key)
  }
`

export const REQUEST_PROJECT_FILE_UPLOAD = gql`
  mutation RequestProjectFileUpload(
    $projectId: ID!
    $fileName: String!
    $contentType: String!
    $fileSize: Int!
  ) {
    requestProjectFileUpload(
      projectId: $projectId
      fileName: $fileName
      contentType: $contentType
      fileSize: $fileSize
    ) {
      uploadUrl
      key
      projectId
      metadata {
        key
        fileName
        originalFileName
        fileSize
        contentType
        environment
        uploadedAt
      }
    }
  }
`

export const FINALIZE_PROJECT_FILE_UPLOAD = gql`
  mutation FinalizeProjectFileUpload(
    $projectId: ID!
    $key: String!
    $caption: String
    $placement: FilePlacement
  ) {
    finalizeProjectFileUpload(
      projectId: $projectId
      key: $key
      caption: $caption
      placement: $placement
    ) {
      id
      fileName
      originalFileName
      fileSize
      contentType
      caption
      placement
      uploadedAt
      downloadUrl
    }
  }
`

export const GET_PROJECT_FILES = gql`
  query GetProjectFiles($projectId: ID!) {
    projectFiles(projectId: $projectId) {
      id
      fileName
      originalFileName
      fileSize
      contentType
      caption
      placement
      uploadedAt
      downloadUrl
    }
  }
`

export const GET_FILES = gql`
  query GetFiles($filter: FileFilterInput) {
    files(filter: $filter) {
      id
      fileName
      originalFileName
      fileSize
      contentType
      uploadedAt
      downloadUrl
      environment
    }
  }
`

export const GET_FILE = gql`
  query GetFile($key: String!) {
    file(key: $key) {
      id
      fileName
      originalFileName
      fileSize
      contentType
      uploadedAt
      downloadUrl
      environment
    }
  }
`

export const DELETE_FILE = gql`
  mutation DeleteFile($key: String!) {
    deleteFile(key: $key)
  }
`

// Hooks
export const useRequestProjectLogoUpload = () => {
  return useMutation<
    RequestProjectLogoUploadMutation,
    RequestProjectLogoUploadMutationVariables
  >(REQUEST_PROJECT_LOGO_UPLOAD)
}

export const useFinalizeProjectLogoUpload = () => {
  return useMutation<
    FinalizeProjectLogoUploadMutation,
    FinalizeProjectLogoUploadMutationVariables
  >(FINALIZE_PROJECT_LOGO_UPLOAD)
}

export const useDeleteFile = () => {
  return useMutation(DELETE_FILE)
}

export const useGetFiles = (filter?: FileFilterInput) => {
  return useQuery(GET_FILES, {
    variables: { filter },
  })
}

export const useGetFile = (key: string) => {
  return useQuery<GetFileQuery, GetFileQueryVariables>(GET_FILE, {
    variables: { key },
    skip: !key,
  })
}

export const useGetProjectFiles = (projectId: string) => {
  return useQuery<GetProjectFilesQuery, GetProjectFilesQueryVariables>(
    GET_PROJECT_FILES,
    {
      variables: { projectId },
      skip: !projectId,
    }
  )
}

/**
 * Resolves a project/file field that may be either a browser-loadable URL
 * (public asset, or a presigned URL) or a bare R2 object key into a usable URL.
 */
export const useResolvedFileUrl = (
  key?: string | null
): { url: string | undefined; loading: boolean } => {
  const shouldFetch = !!key && !isPublicUrl(key)
  const { data, loading } = useGetFile(shouldFetch ? key : '')

  if (!key) return { url: undefined, loading: false }
  if (isPublicUrl(key)) return { url: key, loading: false }
  return { url: data?.file?.downloadUrl ?? undefined, loading }
}

/**
 * Uploads a project logo directly to R2 via presigned URL (avoids sending file bytes through GraphQL).
 */
export const uploadProjectLogo = async (projectId: string, file: File) => {
  const contentType =
    file.type?.trim() || 'application/octet-stream'

  const requestResult = await apolloClient.mutate<
    RequestProjectLogoUploadMutation,
    RequestProjectLogoUploadMutationVariables
  >({
    mutation: REQUEST_PROJECT_LOGO_UPLOAD,
    variables: {
      projectId,
      fileName: file.name,
      contentType,
      fileSize: file.size,
    },
  })

  if (requestResult.error) throw new Error(requestResult.error.message)

  const uploadPayload = requestResult.data?.requestProjectLogoUpload
  if (!uploadPayload) {
    throw new Error('Failed to get upload URL')
  }

  const putResponse = await fetch(uploadPayload.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  })

  if (!putResponse.ok) {
    throw new Error(
      `Direct upload failed: ${putResponse.status} ${putResponse.statusText}`
    )
  }

  const finalizeResult = await apolloClient.mutate<
    FinalizeProjectLogoUploadMutation,
    FinalizeProjectLogoUploadMutationVariables
  >({
    mutation: FINALIZE_PROJECT_LOGO_UPLOAD,
    variables: {
      projectId,
      key: uploadPayload.key,
    },
  })

  if (finalizeResult.error) throw new Error(finalizeResult.error.message)

  const downloadUrl = finalizeResult.data?.finalizeProjectLogoUpload
  if (!downloadUrl) {
    throw new Error('Finalize logo upload returned no download URL')
  }
  return downloadUrl
}

/**
 * Uploads an arbitrary project file (gallery image, document) directly to R2 via presigned
 * URL, then finalizes it with an optional caption/placement.
 */
export const uploadProjectFile = async (
  projectId: string,
  file: File,
  options?: { caption?: string; placement?: FilePlacement }
) => {
  const contentType = file.type?.trim() || 'application/octet-stream'

  const requestResult = await apolloClient.mutate<
    RequestProjectFileUploadMutation,
    RequestProjectFileUploadMutationVariables
  >({
    mutation: REQUEST_PROJECT_FILE_UPLOAD,
    variables: {
      projectId,
      fileName: file.name,
      contentType,
      fileSize: file.size,
    },
  })

  if (requestResult.error) throw new Error(requestResult.error.message)

  const uploadPayload = requestResult.data?.requestProjectFileUpload
  if (!uploadPayload) {
    throw new Error('Failed to get upload URL')
  }

  const putResponse = await fetch(uploadPayload.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  })

  if (!putResponse.ok) {
    throw new Error(
      `Direct upload failed: ${putResponse.status} ${putResponse.statusText}`
    )
  }

  const finalizeResult = await apolloClient.mutate<
    FinalizeProjectFileUploadMutation,
    FinalizeProjectFileUploadMutationVariables
  >({
    mutation: FINALIZE_PROJECT_FILE_UPLOAD,
    variables: {
      projectId,
      key: uploadPayload.key,
      caption: options?.caption,
      placement: options?.placement,
    },
  })

  if (finalizeResult.error) throw new Error(finalizeResult.error.message)

  const uploadedFile = finalizeResult.data?.finalizeProjectFileUpload
  if (!uploadedFile) {
    throw new Error('Finalize file upload returned no result')
  }
  return uploadedFile
}

export const deleteFile = async (key: string) => {
  const result = await apolloClient.mutate<
    DeleteFileMutation,
    DeleteFileMutationVariables
  >({
    mutation: DELETE_FILE,
    variables: { key },
  })

  if (result.error) throw new Error(result.error.message)
  const success = result.data?.deleteFile
  if (!success) throw new Error('No response from DeleteFile mutation')
  return success
}
