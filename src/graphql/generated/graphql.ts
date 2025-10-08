
import { gql } from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client/react';

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions =  {}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type ContactFormInput = {
  readonly email: Scalars['String']['input'];
  readonly message: Scalars['String']['input'];
  readonly name: Scalars['String']['input'];
  readonly subject: Scalars['String']['input'];
};

export type ContactFormSubmission = {
  readonly __typename?: 'ContactFormSubmission';
  readonly email: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly message: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
  readonly subject: Scalars['String']['output'];
  readonly submittedAt: Scalars['String']['output'];
};

export type CreateProjectInput = {
  readonly actualCompletionDate?: InputMaybe<Scalars['String']['input']>;
  readonly budget?: InputMaybe<Scalars['Float']['input']>;
  readonly description: Scalars['String']['input'];
  readonly estimatedCompletionDate?: InputMaybe<Scalars['String']['input']>;
  readonly progressPercentage?: InputMaybe<Scalars['Float']['input']>;
  readonly projectName: Scalars['String']['input'];
  readonly projectType: ProjectType;
  readonly requirements?: InputMaybe<Scalars['String']['input']>;
  readonly startDate?: InputMaybe<Scalars['String']['input']>;
  readonly status: ProjectStatus;
  readonly techStack?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  readonly title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateProjectRequestInput = {
  readonly additionalInfo?: InputMaybe<Scalars['String']['input']>;
  readonly budget?: InputMaybe<Scalars['Float']['input']>;
  readonly contactPreference?: InputMaybe<Scalars['String']['input']>;
  readonly description: Scalars['String']['input'];
  readonly projectName: Scalars['String']['input'];
  readonly projectType: ProjectType;
  readonly requirements?: InputMaybe<Scalars['String']['input']>;
  readonly timeline?: InputMaybe<Scalars['String']['input']>;
  readonly title?: InputMaybe<Scalars['String']['input']>;
};

/** Environment for file storage */
export enum Environment {
  Dev = 'DEV',
  Prod = 'PROD'
}

export type File = {
  readonly __typename?: 'File';
  readonly contentType: Scalars['String']['output'];
  readonly downloadUrl?: Maybe<Scalars['String']['output']>;
  readonly environment: Environment;
  readonly fileName: Scalars['String']['output'];
  readonly fileSize: Scalars['Float']['output'];
  readonly id: Scalars['ID']['output'];
  readonly key: Scalars['String']['output'];
  readonly originalFileName: Scalars['String']['output'];
  readonly project?: Maybe<Scalars['String']['output']>;
  readonly projectId?: Maybe<Scalars['ID']['output']>;
  readonly uploadedAt: Scalars['String']['output'];
  readonly uploadedBy?: Maybe<Scalars['String']['output']>;
  readonly uploadedById?: Maybe<Scalars['ID']['output']>;
};

export type FileFilterInput = {
  readonly contentType?: InputMaybe<Scalars['String']['input']>;
  readonly environment?: InputMaybe<Environment>;
  readonly projectId?: InputMaybe<Scalars['ID']['input']>;
  readonly userId?: InputMaybe<Scalars['ID']['input']>;
};

export type Mutation = {
  readonly __typename?: 'Mutation';
  readonly approveProjectRequest: Scalars['String']['output'];
  readonly assignProject: Project;
  readonly createProject: Project;
  readonly createProjectRequest: ProjectRequest;
  readonly deleteFile: Scalars['Boolean']['output'];
  readonly rejectProjectRequest: Scalars['String']['output'];
  readonly submitContactForm: ContactFormSubmission;
  readonly updateProject: Project;
  readonly updateProjectRequest: ProjectRequest;
  readonly updateProjectRequestStatus: ProjectRequest;
  readonly updateProjectStatus: Project;
  readonly updateUser: User;
  readonly uploadProjectLogo: Scalars['String']['output'];
};


export type MutationApproveProjectRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAssignProjectArgs = {
  developerId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateProjectRequestArgs = {
  input: CreateProjectRequestInput;
};


export type MutationDeleteFileArgs = {
  key: Scalars['String']['input'];
};


export type MutationRejectProjectRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSubmitContactFormArgs = {
  input: ContactFormInput;
};


export type MutationUpdateProjectArgs = {
  id: Scalars['ID']['input'];
  input: UpdateProjectInput;
};


export type MutationUpdateProjectRequestArgs = {
  id: Scalars['ID']['input'];
  input: CreateProjectRequestInput;
};


export type MutationUpdateProjectRequestStatusArgs = {
  id: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};


export type MutationUpdateProjectStatusArgs = {
  id: Scalars['ID']['input'];
  progressPercentage?: InputMaybe<Scalars['Float']['input']>;
  status: Scalars['String']['input'];
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};


export type MutationUploadProjectLogoArgs = {
  contentType: Scalars['String']['input'];
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type Project = {
  readonly __typename?: 'Project';
  readonly actualCompletionDate?: Maybe<Scalars['String']['output']>;
  readonly budget?: Maybe<Scalars['Float']['output']>;
  readonly client?: Maybe<User>;
  readonly clientId: Scalars['ID']['output'];
  readonly collaborators?: Maybe<ReadonlyArray<ProjectCollaborator>>;
  readonly createdAt: Scalars['String']['output'];
  readonly description: Scalars['String']['output'];
  readonly developer?: Maybe<User>;
  readonly developerId?: Maybe<Scalars['ID']['output']>;
  readonly estimatedCompletionDate?: Maybe<Scalars['String']['output']>;
  readonly featured: Scalars['Boolean']['output'];
  readonly id: Scalars['ID']['output'];
  readonly liveUrl?: Maybe<Scalars['String']['output']>;
  readonly logo?: Maybe<Scalars['String']['output']>;
  readonly overview?: Maybe<Scalars['String']['output']>;
  readonly priority?: Maybe<ProjectPriority>;
  readonly progressPercentage?: Maybe<Scalars['Float']['output']>;
  readonly projectName: Scalars['String']['output'];
  readonly projectRequest?: Maybe<ProjectRequest>;
  readonly projectType: ProjectType;
  readonly repositoryUrl?: Maybe<Scalars['String']['output']>;
  readonly requestId?: Maybe<Scalars['ID']['output']>;
  readonly requirements?: Maybe<Scalars['String']['output']>;
  readonly stagingUrl?: Maybe<Scalars['String']['output']>;
  readonly startDate?: Maybe<Scalars['String']['output']>;
  readonly status: ProjectStatus;
  readonly statusUpdates?: Maybe<ReadonlyArray<StatusUpdate>>;
  readonly techStack?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  readonly title?: Maybe<Scalars['String']['output']>;
  readonly updatedAt: Scalars['String']['output'];
};

export type ProjectCollaborator = {
  readonly __typename?: 'ProjectCollaborator';
  readonly id: Scalars['ID']['output'];
  readonly joinedAt: Scalars['String']['output'];
  readonly role: Scalars['String']['output'];
  readonly user?: Maybe<User>;
  readonly userId?: Maybe<Scalars['ID']['output']>;
};

export type ProjectFilter = {
  readonly clientId?: InputMaybe<Scalars['String']['input']>;
  readonly developerId?: InputMaybe<Scalars['String']['input']>;
  readonly priority?: InputMaybe<ProjectPriority>;
  readonly projectType?: InputMaybe<ProjectType>;
  readonly status?: InputMaybe<ProjectStatus>;
};

/** Priority level of a project */
export enum ProjectPriority {
  High = 'High',
  Low = 'Low',
  Medium = 'Medium',
  Urgent = 'Urgent'
}

export type ProjectRequest = {
  readonly __typename?: 'ProjectRequest';
  readonly additionalInfo?: Maybe<Scalars['String']['output']>;
  readonly budget?: Maybe<Scalars['Float']['output']>;
  readonly contactPreference?: Maybe<Scalars['String']['output']>;
  readonly createdAt: Scalars['String']['output'];
  readonly description: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly projectName: Scalars['String']['output'];
  readonly projectType: ProjectType;
  readonly requirements?: Maybe<Scalars['String']['output']>;
  readonly reviewer?: Maybe<User>;
  readonly reviewerId?: Maybe<Scalars['ID']['output']>;
  readonly status: ProjectStatus;
  readonly statusUpdates: ReadonlyArray<StatusUpdate>;
  readonly timeline?: Maybe<Scalars['String']['output']>;
  readonly title?: Maybe<Scalars['String']['output']>;
  readonly updatedAt: Scalars['String']['output'];
  readonly user?: Maybe<User>;
  readonly userId?: Maybe<Scalars['ID']['output']>;
};

export type ProjectRequestFilter = {
  readonly projectName?: InputMaybe<Scalars['String']['input']>;
  readonly projectType?: InputMaybe<ProjectType>;
  readonly reviewerId?: InputMaybe<Scalars['String']['input']>;
  readonly status?: InputMaybe<Scalars['String']['input']>;
  readonly userId?: InputMaybe<Scalars['String']['input']>;
};

/** Status of a project */
export enum ProjectStatus {
  Approved = 'Approved',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  InProgress = 'InProgress',
  InReview = 'InReview',
  InTesting = 'InTesting',
  ReadyForLaunch = 'ReadyForLaunch',
  Requested = 'Requested'
}

export type ProjectSummary = {
  readonly __typename?: 'ProjectSummary';
  readonly activeProjects: Scalars['Float']['output'];
  readonly completedProjects: Scalars['Float']['output'];
  readonly inReviewRequests: Scalars['Float']['output'];
  readonly pendingReviewRequests: Scalars['Float']['output'];
  readonly totalProjects: Scalars['Float']['output'];
  readonly totalRequests: Scalars['Float']['output'];
};

/** Type of project */
export enum ProjectType {
  Api = 'Api',
  Consultation = 'Consultation',
  ECommerce = 'ECommerce',
  Maintenance = 'Maintenance',
  MobileApp = 'MobileApp',
  Other = 'Other',
  WebApp = 'WebApp',
  Website = 'Website'
}

export type Query = {
  readonly __typename?: 'Query';
  readonly featuredProjects: ReadonlyArray<Project>;
  readonly file?: Maybe<File>;
  readonly files: ReadonlyArray<File>;
  readonly me?: Maybe<User>;
  readonly myDashboard: UserDashboard;
  readonly project?: Maybe<Project>;
  readonly projectBySlug?: Maybe<Project>;
  readonly projectFiles: ReadonlyArray<File>;
  readonly projectRequest?: Maybe<ProjectRequest>;
  readonly projectRequests: ReadonlyArray<ProjectRequest>;
  readonly projects: ReadonlyArray<Project>;
  readonly user?: Maybe<User>;
  readonly userFiles: ReadonlyArray<File>;
  readonly users: ReadonlyArray<User>;
};


export type QueryFeaturedProjectsArgs = {
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFileArgs = {
  key: Scalars['String']['input'];
};


export type QueryFilesArgs = {
  filter?: InputMaybe<FileFilterInput>;
};


export type QueryProjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProjectBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryProjectFilesArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryProjectRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProjectRequestsArgs = {
  filter?: InputMaybe<ProjectRequestFilter>;
};


export type QueryProjectsArgs = {
  filter?: InputMaybe<ProjectFilter>;
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserFilesArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  filter?: InputMaybe<UserFilter>;
};

export type StatusUpdate = {
  readonly __typename?: 'StatusUpdate';
  readonly createdAt: Scalars['String']['output'];
  readonly entityId: Scalars['ID']['output'];
  readonly entityType: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly isClientVisible: Scalars['Boolean']['output'];
  readonly newStatus: ProjectStatus;
  readonly oldStatus?: Maybe<ProjectStatus>;
  readonly progressPercentage?: Maybe<Scalars['Float']['output']>;
  readonly updateMessage: Scalars['String']['output'];
  readonly updatedBy: Scalars['ID']['output'];
  readonly updatedByUser?: Maybe<User>;
};

export type UpdateProjectInput = {
  readonly actualCompletionDate?: InputMaybe<Scalars['String']['input']>;
  readonly budget?: InputMaybe<Scalars['Float']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly estimatedCompletionDate?: InputMaybe<Scalars['String']['input']>;
  readonly featured?: InputMaybe<Scalars['Boolean']['input']>;
  readonly logo?: InputMaybe<Scalars['String']['input']>;
  readonly progressPercentage?: InputMaybe<Scalars['Float']['input']>;
  readonly projectName?: InputMaybe<Scalars['String']['input']>;
  readonly projectType?: InputMaybe<ProjectType>;
  readonly requirements?: InputMaybe<Scalars['String']['input']>;
  readonly startDate?: InputMaybe<Scalars['String']['input']>;
  readonly status?: InputMaybe<ProjectStatus>;
  readonly techStack?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  readonly title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  readonly availability?: InputMaybe<Scalars['String']['input']>;
  readonly avatarUrl?: InputMaybe<Scalars['String']['input']>;
  readonly bio?: InputMaybe<Scalars['String']['input']>;
  readonly firstName?: InputMaybe<Scalars['String']['input']>;
  readonly hourlyRate?: InputMaybe<Scalars['Float']['input']>;
  readonly lastName?: InputMaybe<Scalars['String']['input']>;
  readonly portfolio?: InputMaybe<Scalars['String']['input']>;
  readonly skills?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
};

export type User = {
  readonly __typename?: 'User';
  readonly availability?: Maybe<Scalars['String']['output']>;
  readonly avatarUrl?: Maybe<Scalars['String']['output']>;
  readonly bio?: Maybe<Scalars['String']['output']>;
  readonly clerkId?: Maybe<Scalars['String']['output']>;
  readonly createdAt?: Maybe<Scalars['String']['output']>;
  readonly email: Scalars['String']['output'];
  readonly firstName?: Maybe<Scalars['String']['output']>;
  readonly hourlyRate?: Maybe<Scalars['Float']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly lastName?: Maybe<Scalars['String']['output']>;
  readonly portfolio?: Maybe<Scalars['String']['output']>;
  readonly role?: Maybe<UserRole>;
  readonly skills?: Maybe<ReadonlyArray<Scalars['String']['output']>>;
  readonly updatedAt?: Maybe<Scalars['String']['output']>;
};

export type UserDashboard = {
  readonly __typename?: 'UserDashboard';
  readonly assignedProjects: ReadonlyArray<Project>;
  readonly availableProjects: ReadonlyArray<Project>;
  readonly projectRequests: ReadonlyArray<ProjectRequest>;
  readonly projects: ReadonlyArray<Project>;
  readonly summary: ProjectSummary;
};

export type UserFilter = {
  readonly availability?: InputMaybe<Scalars['String']['input']>;
  readonly email?: InputMaybe<Scalars['String']['input']>;
  readonly firstName?: InputMaybe<Scalars['String']['input']>;
  readonly lastName?: InputMaybe<Scalars['String']['input']>;
  readonly role?: InputMaybe<UserRole>;
};

/** User role in the system */
export enum UserRole {
  Admin = 'Admin',
  Client = 'Client',
  Developer = 'Developer',
  SuperAdmin = 'SuperAdmin'
}

export type SubmitContactFormMutationVariables = Exact<{
  input: ContactFormInput;
}>;


export type SubmitContactFormMutation = { readonly __typename?: 'Mutation', readonly submitContactForm: { readonly __typename?: 'ContactFormSubmission', readonly id: string, readonly name: string, readonly email: string, readonly subject: string, readonly message: string, readonly submittedAt: string } };

export type GetMyDashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyDashboardQuery = { readonly __typename?: 'Query', readonly myDashboard: { readonly __typename?: 'UserDashboard', readonly summary: { readonly __typename?: 'ProjectSummary', readonly totalProjects: number, readonly activeProjects: number, readonly completedProjects: number, readonly totalRequests: number, readonly pendingReviewRequests: number, readonly inReviewRequests: number }, readonly projects: ReadonlyArray<{ readonly __typename?: 'Project', readonly budget?: number | null, readonly progressPercentage?: number | null, readonly startDate?: string | null, readonly estimatedCompletionDate?: string | null, readonly actualCompletionDate?: string | null, readonly updatedAt: string, readonly stagingUrl?: string | null, readonly requestId?: string | null, readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string, readonly projectRequest?: { readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string, readonly statusUpdates: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly newStatus: ProjectStatus, readonly updateMessage: string, readonly createdAt: string }>, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null } | null, readonly client?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null, readonly developer?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null }>, readonly projectRequests: ReadonlyArray<{ readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string, readonly statusUpdates: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly newStatus: ProjectStatus, readonly updateMessage: string, readonly createdAt: string }>, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null }>, readonly availableProjects: ReadonlyArray<{ readonly __typename?: 'Project', readonly budget?: number | null, readonly startDate?: string | null, readonly estimatedCompletionDate?: string | null, readonly updatedAt: string, readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string, readonly client?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null }>, readonly assignedProjects: ReadonlyArray<{ readonly __typename?: 'Project', readonly budget?: number | null, readonly progressPercentage?: number | null, readonly startDate?: string | null, readonly estimatedCompletionDate?: string | null, readonly actualCompletionDate?: string | null, readonly updatedAt: string, readonly stagingUrl?: string | null, readonly requestId?: string | null, readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string, readonly projectRequest?: { readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string, readonly statusUpdates: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly newStatus: ProjectStatus, readonly updateMessage: string, readonly createdAt: string }>, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null } | null, readonly client?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null, readonly developer?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null }> } };

export type UploadProjectLogoMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  file: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
}>;


export type UploadProjectLogoMutation = { readonly __typename?: 'Mutation', readonly uploadProjectLogo: string };

export type GetFilesQueryVariables = Exact<{
  filter?: InputMaybe<FileFilterInput>;
}>;


export type GetFilesQuery = { readonly __typename?: 'Query', readonly files: ReadonlyArray<{ readonly __typename?: 'File', readonly id: string, readonly fileName: string, readonly originalFileName: string, readonly fileSize: number, readonly contentType: string, readonly uploadedAt: string, readonly downloadUrl?: string | null, readonly environment: Environment }> };

export type GetFileQueryVariables = Exact<{
  key: Scalars['String']['input'];
}>;


export type GetFileQuery = { readonly __typename?: 'Query', readonly file?: { readonly __typename?: 'File', readonly id: string, readonly fileName: string, readonly originalFileName: string, readonly fileSize: number, readonly contentType: string, readonly uploadedAt: string, readonly downloadUrl?: string | null, readonly environment: Environment } | null };

export type DeleteFileMutationVariables = Exact<{
  key: Scalars['String']['input'];
}>;


export type DeleteFileMutation = { readonly __typename?: 'Mutation', readonly deleteFile: boolean };

export type UserDisplayFragment = { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string };

export type ProjectDisplayFragment = { readonly __typename?: 'Project', readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string };

export type ProjectRequestDisplayFragment = { readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string, readonly statusUpdates: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly newStatus: ProjectStatus, readonly updateMessage: string, readonly createdAt: string }>, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null };

export type DashboardProjectFragment = { readonly __typename?: 'Project', readonly budget?: number | null, readonly progressPercentage?: number | null, readonly startDate?: string | null, readonly estimatedCompletionDate?: string | null, readonly actualCompletionDate?: string | null, readonly updatedAt: string, readonly stagingUrl?: string | null, readonly requestId?: string | null, readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string, readonly projectRequest?: { readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string, readonly statusUpdates: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly newStatus: ProjectStatus, readonly updateMessage: string, readonly createdAt: string }>, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null } | null, readonly client?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null, readonly developer?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null };

export type GetProjectsQueryVariables = Exact<{
  filter?: InputMaybe<ProjectFilter>;
  userEmail?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetProjectsQuery = { readonly __typename?: 'Query', readonly projects: ReadonlyArray<{ readonly __typename?: 'Project', readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string }> };

export type GetFeaturedProjectsQueryVariables = Exact<{
  userEmail?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetFeaturedProjectsQuery = { readonly __typename?: 'Query', readonly featuredProjects: ReadonlyArray<{ readonly __typename?: 'Project', readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string }> };

export type GetProjectBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type GetProjectBySlugQuery = { readonly __typename?: 'Query', readonly projectBySlug?: { readonly __typename?: 'Project', readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly budget?: number | null, readonly requirements?: string | null, readonly techStack?: ReadonlyArray<string> | null, readonly status: ProjectStatus, readonly progressPercentage?: number | null, readonly priority?: ProjectPriority | null, readonly startDate?: string | null, readonly estimatedCompletionDate?: string | null, readonly actualCompletionDate?: string | null, readonly repositoryUrl?: string | null, readonly liveUrl?: string | null, readonly stagingUrl?: string | null, readonly featured: boolean, readonly logo?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly clientId: string, readonly developerId?: string | null, readonly requestId?: string | null, readonly client?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null, readonly developer?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null, readonly collaborators?: ReadonlyArray<{ readonly __typename?: 'ProjectCollaborator', readonly id: string, readonly role: string, readonly joinedAt: string, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null }> | null, readonly statusUpdates?: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly entityType: string, readonly entityId: string, readonly oldStatus?: ProjectStatus | null, readonly newStatus: ProjectStatus, readonly progressPercentage?: number | null, readonly updateMessage: string, readonly isClientVisible: boolean, readonly updatedBy: string, readonly createdAt: string, readonly updatedByUser?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null }> | null } | null };

export type AssignProjectMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  developerId: Scalars['ID']['input'];
}>;


export type AssignProjectMutation = { readonly __typename?: 'Mutation', readonly assignProject: { readonly __typename?: 'Project', readonly budget?: number | null, readonly progressPercentage?: number | null, readonly startDate?: string | null, readonly estimatedCompletionDate?: string | null, readonly actualCompletionDate?: string | null, readonly updatedAt: string, readonly stagingUrl?: string | null, readonly requestId?: string | null, readonly id: string, readonly title?: string | null, readonly projectName: string, readonly description: string, readonly overview?: string | null, readonly projectType: ProjectType, readonly status: ProjectStatus, readonly techStack?: ReadonlyArray<string> | null, readonly featured: boolean, readonly logo?: string | null, readonly liveUrl?: string | null, readonly repositoryUrl?: string | null, readonly createdAt: string, readonly projectRequest?: { readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string, readonly statusUpdates: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly newStatus: ProjectStatus, readonly updateMessage: string, readonly createdAt: string }>, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null } | null, readonly client?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null, readonly developer?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null } };

export type GetProjectRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProjectRequestsQuery = { readonly __typename?: 'Query', readonly projectRequests: ReadonlyArray<{ readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string, readonly statusUpdates: ReadonlyArray<{ readonly __typename?: 'StatusUpdate', readonly id: string, readonly newStatus: ProjectStatus, readonly updateMessage: string, readonly createdAt: string }>, readonly user?: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string } | null }> };

export type CreateProjectRequestMutationVariables = Exact<{
  input: CreateProjectRequestInput;
}>;


export type CreateProjectRequestMutation = { readonly __typename?: 'Mutation', readonly createProjectRequest: { readonly __typename?: 'ProjectRequest', readonly id: string, readonly projectName: string, readonly title?: string | null, readonly description: string, readonly projectType: ProjectType, readonly budget?: number | null, readonly timeline?: string | null, readonly requirements?: string | null, readonly contactPreference?: string | null, readonly additionalInfo?: string | null, readonly status: ProjectStatus, readonly createdAt: string, readonly updatedAt: string } };

export type ApproveProjectRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ApproveProjectRequestMutation = { readonly __typename?: 'Mutation', readonly approveProjectRequest: string };

export type UpdateProjectRequestStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: Scalars['String']['input'];
}>;


export type UpdateProjectRequestStatusMutation = { readonly __typename?: 'Mutation', readonly updateProjectRequestStatus: { readonly __typename?: 'ProjectRequest', readonly id: string, readonly status: ProjectStatus, readonly updatedAt: string } };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { readonly __typename?: 'Query', readonly me?: { readonly __typename?: 'User', readonly id: string, readonly clerkId?: string | null, readonly email: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly role?: UserRole | null, readonly bio?: string | null, readonly skills?: ReadonlyArray<string> | null, readonly portfolio?: string | null, readonly hourlyRate?: number | null, readonly availability?: string | null, readonly avatarUrl?: string | null, readonly createdAt?: string | null, readonly updatedAt?: string | null } | null };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { readonly __typename?: 'Query', readonly user?: { readonly __typename?: 'User', readonly id: string, readonly clerkId?: string | null, readonly email: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly role?: UserRole | null, readonly bio?: string | null, readonly skills?: ReadonlyArray<string> | null, readonly portfolio?: string | null, readonly hourlyRate?: number | null, readonly availability?: string | null, readonly avatarUrl?: string | null, readonly createdAt?: string | null, readonly updatedAt?: string | null } | null };

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { readonly __typename?: 'Mutation', readonly updateUser: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly bio?: string | null, readonly skills?: ReadonlyArray<string> | null, readonly portfolio?: string | null, readonly hourlyRate?: number | null, readonly availability?: string | null, readonly updatedAt?: string | null } };

export const ProjectDisplayFragmentDoc = gql`
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
    `;
export const UserDisplayFragmentDoc = gql`
    fragment UserDisplay on User {
  id
  firstName
  lastName
  email
}
    `;
export const ProjectRequestDisplayFragmentDoc = gql`
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
  statusUpdates {
    id
    newStatus
    updateMessage
    createdAt
  }
  createdAt
  updatedAt
  user {
    ...UserDisplay
  }
}
    ${UserDisplayFragmentDoc}`;
export const DashboardProjectFragmentDoc = gql`
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
  projectRequest {
    ...ProjectRequestDisplay
  }
  client {
    ...UserDisplay
  }
  developer {
    ...UserDisplay
  }
}
    ${ProjectDisplayFragmentDoc}
${ProjectRequestDisplayFragmentDoc}
${UserDisplayFragmentDoc}`;
export const SubmitContactFormDocument = gql`
    mutation SubmitContactForm($input: ContactFormInput!) {
  submitContactForm(input: $input) {
    id
    name
    email
    subject
    message
    submittedAt
  }
}
    `;

/**
 * __useSubmitContactFormMutation__
 *
 * To run a mutation, you first call `useSubmitContactFormMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitContactFormMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitContactFormMutation, { data, loading, error }] = useSubmitContactFormMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSubmitContactFormMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SubmitContactFormMutation, SubmitContactFormMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SubmitContactFormMutation, SubmitContactFormMutationVariables>(SubmitContactFormDocument, options);
      }
export type SubmitContactFormMutationHookResult = ReturnType<typeof useSubmitContactFormMutation>;
export const GetMyDashboardDocument = gql`
    query GetMyDashboard {
  myDashboard {
    summary {
      totalProjects
      activeProjects
      completedProjects
      totalRequests
      pendingReviewRequests
      inReviewRequests
    }
    projects {
      ...DashboardProject
    }
    projectRequests {
      ...ProjectRequestDisplay
    }
    availableProjects {
      ...ProjectDisplay
      budget
      startDate
      estimatedCompletionDate
      updatedAt
      client {
        ...UserDisplay
      }
    }
    assignedProjects {
      ...DashboardProject
    }
  }
}
    ${DashboardProjectFragmentDoc}
${ProjectRequestDisplayFragmentDoc}
${ProjectDisplayFragmentDoc}
${UserDisplayFragmentDoc}`;

/**
 * __useGetMyDashboardQuery__
 *
 * To run a query within a React component, call `useGetMyDashboardQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyDashboardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyDashboardQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMyDashboardQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyDashboardQuery, GetMyDashboardQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyDashboardQuery, GetMyDashboardQueryVariables>(GetMyDashboardDocument, options);
      }
export function useGetMyDashboardLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyDashboardQuery, GetMyDashboardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyDashboardQuery, GetMyDashboardQueryVariables>(GetMyDashboardDocument, options);
        }
export type GetMyDashboardQueryHookResult = ReturnType<typeof useGetMyDashboardQuery>;
export type GetMyDashboardLazyQueryHookResult = ReturnType<typeof useGetMyDashboardLazyQuery>;
export const UploadProjectLogoDocument = gql`
    mutation UploadProjectLogo($projectId: ID!, $file: String!, $fileName: String!, $contentType: String!) {
  uploadProjectLogo(
    projectId: $projectId
    file: $file
    fileName: $fileName
    contentType: $contentType
  )
}
    `;

/**
 * __useUploadProjectLogoMutation__
 *
 * To run a mutation, you first call `useUploadProjectLogoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadProjectLogoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadProjectLogoMutation, { data, loading, error }] = useUploadProjectLogoMutation({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      file: // value for 'file'
 *      fileName: // value for 'fileName'
 *      contentType: // value for 'contentType'
 *   },
 * });
 */
export function useUploadProjectLogoMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UploadProjectLogoMutation, UploadProjectLogoMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UploadProjectLogoMutation, UploadProjectLogoMutationVariables>(UploadProjectLogoDocument, options);
      }
export type UploadProjectLogoMutationHookResult = ReturnType<typeof useUploadProjectLogoMutation>;
export const GetFilesDocument = gql`
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
    `;

/**
 * __useGetFilesQuery__
 *
 * To run a query within a React component, call `useGetFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFilesQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *   },
 * });
 */
export function useGetFilesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetFilesQuery, GetFilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFilesQuery, GetFilesQueryVariables>(GetFilesDocument, options);
      }
export function useGetFilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFilesQuery, GetFilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFilesQuery, GetFilesQueryVariables>(GetFilesDocument, options);
        }
export type GetFilesQueryHookResult = ReturnType<typeof useGetFilesQuery>;
export type GetFilesLazyQueryHookResult = ReturnType<typeof useGetFilesLazyQuery>;
export const GetFileDocument = gql`
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
    `;

/**
 * __useGetFileQuery__
 *
 * To run a query within a React component, call `useGetFileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFileQuery({
 *   variables: {
 *      key: // value for 'key'
 *   },
 * });
 */
export function useGetFileQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetFileQuery, GetFileQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFileQuery, GetFileQueryVariables>(GetFileDocument, options);
      }
export function useGetFileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFileQuery, GetFileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFileQuery, GetFileQueryVariables>(GetFileDocument, options);
        }
export type GetFileQueryHookResult = ReturnType<typeof useGetFileQuery>;
export type GetFileLazyQueryHookResult = ReturnType<typeof useGetFileLazyQuery>;
export const DeleteFileDocument = gql`
    mutation DeleteFile($key: String!) {
  deleteFile(key: $key)
}
    `;

/**
 * __useDeleteFileMutation__
 *
 * To run a mutation, you first call `useDeleteFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFileMutation, { data, loading, error }] = useDeleteFileMutation({
 *   variables: {
 *      key: // value for 'key'
 *   },
 * });
 */
export function useDeleteFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteFileMutation, DeleteFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteFileMutation, DeleteFileMutationVariables>(DeleteFileDocument, options);
      }
export type DeleteFileMutationHookResult = ReturnType<typeof useDeleteFileMutation>;
export const GetProjectsDocument = gql`
    query GetProjects($filter: ProjectFilter, $userEmail: String) {
  projects(filter: $filter, userEmail: $userEmail) {
    ...ProjectDisplay
  }
}
    ${ProjectDisplayFragmentDoc}`;

/**
 * __useGetProjectsQuery__
 *
 * To run a query within a React component, call `useGetProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectsQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      userEmail: // value for 'userEmail'
 *   },
 * });
 */
export function useGetProjectsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetProjectsQuery, GetProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProjectsQuery, GetProjectsQueryVariables>(GetProjectsDocument, options);
      }
export function useGetProjectsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProjectsQuery, GetProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProjectsQuery, GetProjectsQueryVariables>(GetProjectsDocument, options);
        }
export type GetProjectsQueryHookResult = ReturnType<typeof useGetProjectsQuery>;
export type GetProjectsLazyQueryHookResult = ReturnType<typeof useGetProjectsLazyQuery>;
export const GetFeaturedProjectsDocument = gql`
    query GetFeaturedProjects($userEmail: String) {
  featuredProjects(userEmail: $userEmail) {
    ...ProjectDisplay
  }
}
    ${ProjectDisplayFragmentDoc}`;

/**
 * __useGetFeaturedProjectsQuery__
 *
 * To run a query within a React component, call `useGetFeaturedProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeaturedProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeaturedProjectsQuery({
 *   variables: {
 *      userEmail: // value for 'userEmail'
 *   },
 * });
 */
export function useGetFeaturedProjectsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetFeaturedProjectsQuery, GetFeaturedProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFeaturedProjectsQuery, GetFeaturedProjectsQueryVariables>(GetFeaturedProjectsDocument, options);
      }
export function useGetFeaturedProjectsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFeaturedProjectsQuery, GetFeaturedProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFeaturedProjectsQuery, GetFeaturedProjectsQueryVariables>(GetFeaturedProjectsDocument, options);
        }
export type GetFeaturedProjectsQueryHookResult = ReturnType<typeof useGetFeaturedProjectsQuery>;
export type GetFeaturedProjectsLazyQueryHookResult = ReturnType<typeof useGetFeaturedProjectsLazyQuery>;
export const GetProjectBySlugDocument = gql`
    query GetProjectBySlug($slug: String!) {
  projectBySlug(slug: $slug) {
    id
    title
    projectName
    description
    overview
    projectType
    budget
    requirements
    techStack
    status
    progressPercentage
    priority
    startDate
    estimatedCompletionDate
    actualCompletionDate
    repositoryUrl
    liveUrl
    stagingUrl
    featured
    logo
    createdAt
    updatedAt
    clientId
    developerId
    requestId
    client {
      ...UserDisplay
    }
    developer {
      ...UserDisplay
    }
    collaborators {
      id
      role
      joinedAt
      user {
        ...UserDisplay
      }
    }
    statusUpdates {
      id
      entityType
      entityId
      oldStatus
      newStatus
      progressPercentage
      updateMessage
      isClientVisible
      updatedBy
      createdAt
      updatedByUser {
        ...UserDisplay
      }
    }
  }
}
    ${UserDisplayFragmentDoc}`;

/**
 * __useGetProjectBySlugQuery__
 *
 * To run a query within a React component, call `useGetProjectBySlugQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectBySlugQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectBySlugQuery({
 *   variables: {
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function useGetProjectBySlugQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProjectBySlugQuery, GetProjectBySlugQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProjectBySlugQuery, GetProjectBySlugQueryVariables>(GetProjectBySlugDocument, options);
      }
export function useGetProjectBySlugLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProjectBySlugQuery, GetProjectBySlugQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProjectBySlugQuery, GetProjectBySlugQueryVariables>(GetProjectBySlugDocument, options);
        }
export type GetProjectBySlugQueryHookResult = ReturnType<typeof useGetProjectBySlugQuery>;
export type GetProjectBySlugLazyQueryHookResult = ReturnType<typeof useGetProjectBySlugLazyQuery>;
export const AssignProjectDocument = gql`
    mutation AssignProject($projectId: ID!, $developerId: ID!) {
  assignProject(projectId: $projectId, developerId: $developerId) {
    ...DashboardProject
  }
}
    ${DashboardProjectFragmentDoc}`;

/**
 * __useAssignProjectMutation__
 *
 * To run a mutation, you first call `useAssignProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignProjectMutation, { data, loading, error }] = useAssignProjectMutation({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      developerId: // value for 'developerId'
 *   },
 * });
 */
export function useAssignProjectMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AssignProjectMutation, AssignProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AssignProjectMutation, AssignProjectMutationVariables>(AssignProjectDocument, options);
      }
export type AssignProjectMutationHookResult = ReturnType<typeof useAssignProjectMutation>;
export const GetProjectRequestsDocument = gql`
    query GetProjectRequests {
  projectRequests {
    ...ProjectRequestDisplay
  }
}
    ${ProjectRequestDisplayFragmentDoc}`;

/**
 * __useGetProjectRequestsQuery__
 *
 * To run a query within a React component, call `useGetProjectRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetProjectRequestsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetProjectRequestsQuery, GetProjectRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProjectRequestsQuery, GetProjectRequestsQueryVariables>(GetProjectRequestsDocument, options);
      }
export function useGetProjectRequestsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProjectRequestsQuery, GetProjectRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProjectRequestsQuery, GetProjectRequestsQueryVariables>(GetProjectRequestsDocument, options);
        }
export type GetProjectRequestsQueryHookResult = ReturnType<typeof useGetProjectRequestsQuery>;
export type GetProjectRequestsLazyQueryHookResult = ReturnType<typeof useGetProjectRequestsLazyQuery>;
export const CreateProjectRequestDocument = gql`
    mutation CreateProjectRequest($input: CreateProjectRequestInput!) {
  createProjectRequest(input: $input) {
    id
    projectName
    title
    description
    projectType
    budget
    timeline
    requirements
    contactPreference
    additionalInfo
    status
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useCreateProjectRequestMutation__
 *
 * To run a mutation, you first call `useCreateProjectRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProjectRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProjectRequestMutation, { data, loading, error }] = useCreateProjectRequestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProjectRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateProjectRequestMutation, CreateProjectRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateProjectRequestMutation, CreateProjectRequestMutationVariables>(CreateProjectRequestDocument, options);
      }
export type CreateProjectRequestMutationHookResult = ReturnType<typeof useCreateProjectRequestMutation>;
export const ApproveProjectRequestDocument = gql`
    mutation ApproveProjectRequest($id: ID!) {
  approveProjectRequest(id: $id)
}
    `;

/**
 * __useApproveProjectRequestMutation__
 *
 * To run a mutation, you first call `useApproveProjectRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveProjectRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveProjectRequestMutation, { data, loading, error }] = useApproveProjectRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApproveProjectRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ApproveProjectRequestMutation, ApproveProjectRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ApproveProjectRequestMutation, ApproveProjectRequestMutationVariables>(ApproveProjectRequestDocument, options);
      }
export type ApproveProjectRequestMutationHookResult = ReturnType<typeof useApproveProjectRequestMutation>;
export const UpdateProjectRequestStatusDocument = gql`
    mutation UpdateProjectRequestStatus($id: ID!, $status: String!) {
  updateProjectRequestStatus(id: $id, status: $status) {
    id
    status
    updatedAt
  }
}
    `;

/**
 * __useUpdateProjectRequestStatusMutation__
 *
 * To run a mutation, you first call `useUpdateProjectRequestStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProjectRequestStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProjectRequestStatusMutation, { data, loading, error }] = useUpdateProjectRequestStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useUpdateProjectRequestStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProjectRequestStatusMutation, UpdateProjectRequestStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProjectRequestStatusMutation, UpdateProjectRequestStatusMutationVariables>(UpdateProjectRequestStatusDocument, options);
      }
export type UpdateProjectRequestStatusMutationHookResult = ReturnType<typeof useUpdateProjectRequestStatusMutation>;
export const GetMeDocument = gql`
    query GetMe {
  me {
    id
    clerkId
    email
    firstName
    lastName
    role
    bio
    skills
    portfolio
    hourlyRate
    availability
    avatarUrl
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetMeQuery__
 *
 * To run a query within a React component, call `useGetMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
      }
export function useGetMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
export type GetMeQueryHookResult = ReturnType<typeof useGetMeQuery>;
export type GetMeLazyQueryHookResult = ReturnType<typeof useGetMeLazyQuery>;
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  user(id: $id) {
    id
    clerkId
    email
    firstName
    lastName
    role
    bio
    skills
    portfolio
    hourlyRate
    availability
    avatarUrl
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    firstName
    lastName
    bio
    skills
    portfolio
    hourlyRate
    availability
    updatedAt
  }
}
    `;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;