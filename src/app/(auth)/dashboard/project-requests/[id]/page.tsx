import type { Metadata } from 'next'

import { AnimatedHeading, ProjectRequestDetail  } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'



export const metadata: Metadata = {
  title: `Project Request - ${BRAND_NAME}`,
}

type PageProps = {
  params: Promise<{ id: string }>
}

const ProjectRequestPage = async ({ params }: PageProps) => {
  const { id } = await params

  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl'>
          <div className='mb-12 text-center'>
            <AnimatedHeading
              text='PROJECT REQUEST'
              level='h1'
              variant='section'
              className='mb-4'
            />
          </div>

          <ProjectRequestDetail id={id} />
        </div>
      </div>
    </CleanPageTemplate>
  )
}

export default ProjectRequestPage
