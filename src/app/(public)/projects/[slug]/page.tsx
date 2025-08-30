import Link from 'next/link'

import { getProjectBySlug } from '@/apiClients/projectApiClient'
import { ProjectDetailsTemplate } from '@/components/templates'

type IPortfolioDetailProps = {
  params: Promise<{ slug: string }>
}

export default async function PortfolioDetail(props: IPortfolioDetailProps) {
  const { slug } = await props.params

  const project = await getProjectBySlug(slug)

  if (!project) {
    return (
      <div className='min-h-screen bg-black'>
        <div className='container mx-auto px-4'>
          <div className='text-center'>
            <h1 className='mb-8 font-mono text-4xl font-bold text-green-400'>
              Project Not Found
            </h1>
            <p className='font-mono text-lg text-green-300 opacity-80'>
              The requested project could not be found
            </p>
            <div className='mt-8'>
              <Link
                href='/projects'
                className='inline-block rounded border border-green-400 bg-green-400/10 px-6 py-2 font-mono text-green-400 transition-all duration-300 hover:bg-green-400 hover:text-black'
              >
                ← BACK TO PROJECTS
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ProjectDetailsTemplate project={project} />
    </>
  )
}
