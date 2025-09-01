import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

export enum Environment {
  DEV = 'DEV',
  PROD = 'PROD',
}

registerEnumType(Environment, {
  name: 'Environment',
  description: 'Environment for file storage',
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

@ObjectType('ProjectLogoUploadResult')
export class ProjectLogoUploadResult {
  @Field(() => String)
  uploadUrl!: string

  @Field(() => String)
  key!: string

  @Field(() => File)
  metadata!: File

  @Field(() => ID)
  projectId!: string
}
