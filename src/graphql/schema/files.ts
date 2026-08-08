import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  ObjectType, 
registerEnumType 
} from 'type-graphql'


export enum Environment {
  DEV = 'DEV',
  PROD = 'PROD',
}

registerEnumType(Environment, {
  name: 'Environment',
  description: 'Environment for file storage',
})

export enum FilePlacement {
  Gallery = 'gallery',
  Document = 'document',
  Other = 'other',
}

registerEnumType(FilePlacement, {
  name: 'FilePlacement',
  description: 'Where an uploaded project file should be displayed',
})

@ObjectType('File')
export class File {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  key!: string

  @Field(() => String)
  fileName!: string

  @Field(() => String)
  originalFileName!: string

  @Field(() => Number)
  fileSize!: number

  @Field(() => String)
  contentType!: string

  @Field(() => ID, { nullable: true })
  uploadedById?: string

  @Field(() => ID, { nullable: true })
  projectId?: string

  // These will be resolved by field resolvers
  @Field(() => String, { nullable: true })
  uploadedBy?: string

  @Field(() => String, { nullable: true })
  project?: string

  @Field(() => Environment)
  environment!: Environment

  @Field(() => String)
  uploadedAt!: string

  @Field(() => String, { nullable: true })
  downloadUrl?: string

  @Field(() => String, { nullable: true })
  caption?: string

  @Field(() => FilePlacement, { nullable: true })
  placement?: FilePlacement
}

@InputType('FileUploadInput')
export class FileUploadInput {
  @Field(() => String)
  fileName!: string

  @Field(() => String)
  originalFileName!: string

  @Field(() => Number)
  fileSize!: number

  @Field(() => String)
  contentType!: string

  @Field(() => ID, { nullable: true })
  projectId?: string

  @Field(() => Environment)
  environment!: Environment

  @Field(() => String, { nullable: true })
  caption?: string

  @Field(() => FilePlacement, { nullable: true })
  placement?: FilePlacement
}

@InputType('FileFilterInput')
export class FileFilterInput {
  @Field(() => ID, { nullable: true })
  projectId?: string

  @Field(() => ID, { nullable: true })
  userId?: string

  @Field(() => String, { nullable: true })
  contentType?: string

  @Field(() => Environment, { nullable: true })
  environment?: Environment
}

@ObjectType('FileUploadMetadata')
export class FileUploadMetadata {
  @Field(() => String)
  key!: string

  @Field(() => String)
  fileName!: string

  @Field(() => String)
  originalFileName!: string

  @Field(() => Int)
  fileSize!: number

  @Field(() => String)
  contentType!: string

  @Field(() => Environment)
  environment!: Environment

  @Field(() => GraphQLISODateTime)
  uploadedAt!: string
}

@ObjectType('ProjectLogoUploadResult')
export class ProjectLogoUploadResult {
  @Field(() => String)
  uploadUrl!: string

  @Field(() => String)
  key!: string

  @Field(() => FileUploadMetadata)
  metadata!: FileUploadMetadata

  @Field(() => ID)
  projectId!: string
}

@ObjectType('ProjectFileUploadResult')
export class ProjectFileUploadResult {
  @Field(() => String)
  uploadUrl!: string

  @Field(() => String)
  key!: string

  @Field(() => FileUploadMetadata)
  metadata!: FileUploadMetadata

  @Field(() => ID)
  projectId!: string
}
