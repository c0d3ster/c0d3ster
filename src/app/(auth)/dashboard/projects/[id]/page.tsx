import type { Metadata } from 'next'

import { AnimatedHeading, ProjectFilesPanel } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { BRAND_NAME } from '@/constants'

export const metadata: Metadata = {
  title: `Project Files - ${BRAND_NAME}`,
}

type PageProps = {
  params: Promise<{ id: string }>
}

const ProjectDetailPage = async ({ params }: PageProps) => {
  const { id } = await params

  return (
    <CleanPageTemplate>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl'>
          <div className='mb-12 text-center'>
            <AnimatedHeading
              text='PROJECT FILES'
              level='h1'
              variant='section'
              className='mb-4'
            />
          </div>

          <ProjectFilesPanel projectId={id} />
        </div>
      </div>
    </CleanPageTemplate>
  )
}

export default ProjectDetailPage
