import { Field, ID, InputType, ObjectType } from 'type-graphql'

@ObjectType('ContactFormSubmission')
export class ContactFormSubmission {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => String)
  email!: string

  @Field(() => String)
  subject!: string

  @Field(() => String)
  message!: string

  @Field(() => String)
  submittedAt!: string
}

@InputType('ContactFormInput')
export class ContactFormInput {
  @Field(() => String)
  name!: string

  @Field(() => String)
  email!: string

  @Field(() => String)
  subject!: string

  @Field(() => String)
  message!: string
}
