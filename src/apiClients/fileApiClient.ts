import { useMutation, useQuery } from '@apollo/client/react'
import { gql } from 'graphql-tag'

import type {
  DeleteFileMutation,
  DeleteFileMutationVariables,
  FileFilterInput,
  FileUploadInput,
  UploadProjectLogoMutation,
  UploadProjectLogoMutationVariables,
} from '@/graphql/generated/graphql'

import { apolloClient } from '@/libs/ApolloClient'

export const UPLOAD_PROJECT_LOGO = gql`
  mutation UploadProjectLogo($projectId: ID!, $input: FileUploadInput!) {
    uploadProjectLogo(projectId: $projectId, input: $input) {
      uploadUrl
      key
      projectId
      metadata {
        id
        fileName
        contentType
      }
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
export const useUploadProjectLogo = () => {
  return useMutation(UPLOAD_PROJECT_LOGO)
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
  return useQuery(GET_FILE, {
    variables: { key },
  })
}

// Async functions

export const uploadProjectLogo = async (
  projectId: string,
  input: FileUploadInput
) => {
  const result = await apolloClient.mutate<
    UploadProjectLogoMutation,
    UploadProjectLogoMutationVariables
  >({
    mutation: UPLOAD_PROJECT_LOGO,
    variables: { projectId, input },
  })

  if (result.error) throw new Error(result.error.message)
  const payload = result.data?.uploadProjectLogo
  if (!payload)
    throw new Error('No data returned from UploadProjectLogo mutation')
  return payload
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
