import { useMutation, useQuery } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  DeleteFileMutation,
  DeleteFileMutationVariables,
  FileFilterInput,
  FinalizeProjectLogoUploadMutation,
  FinalizeProjectLogoUploadMutationVariables,
  GetFileQuery,
  GetFileQueryVariables,
  RequestProjectLogoUploadMutation,
  RequestProjectLogoUploadMutationVariables,
} from '@/graphql/generated/graphql'

import { apolloClient } from '@/libs/ApolloClient'

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

  return finalizeResult.data?.finalizeProjectLogoUpload
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
