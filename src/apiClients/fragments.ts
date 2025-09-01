import { gql } from 'graphql-tag'

// User display fragment - contains core user information for display purposes
export const USER_DISPLAY_FRAGMENT = gql`
  fragment UserDisplay on User {
    id
    firstName
    lastName
    email
  }
`

// Project display fragment - contains core project information for lists/cards
export const PROJECT_DISPLAY_FRAGMENT = gql`
  fragment ProjectDisplay on Project {
    id
    title
    projectName
    description
    overview
    projectType
    status
    techStack
    featured
    logo
    liveUrl
    repositoryUrl
    createdAt
  }
`

// Project request display fragment - contains core project request information
export const PROJECT_REQUEST_DISPLAY_FRAGMENT = gql`
  fragment ProjectRequestDisplay on ProjectRequest {
    id
    projectName
    title
    description
    projectType
    budget
    timeline
    requirements
    additionalInfo
    status
    createdAt
    user {
      ...UserDisplay
    }
  }
  ${USER_DISPLAY_FRAGMENT}
`

// Dashboard project fragment - extends display with additional dashboard-specific fields
export const DASHBOARD_PROJECT_FRAGMENT = gql`
  fragment DashboardProject on Project {
    ...ProjectDisplay
    budget
    progressPercentage
    startDate
    estimatedCompletionDate
    actualCompletionDate
    updatedAt
    stagingUrl
    requestId
    client {
      ...UserDisplay
    }
    developer {
      ...UserDisplay
    }
  }
  ${PROJECT_DISPLAY_FRAGMENT}
  ${USER_DISPLAY_FRAGMENT}
`
