import Link from 'next/link'

import { getFeaturedProjects } from '@/apiClients'
import { ProjectDetailsTemplate } from '@/components/templates'
import { SUPPORT_EMAIL } from '@/constants'

type IPortfolioDetailProps = {
  params: Promise<{ slug: string }>
}

// Helper function to create slug from project name
const createSlug = (projectName: string) => {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function PortfolioDetail(props: IPortfolioDetailProps) {
  const { slug } = await props.params

  const projects = await getFeaturedProjects(SUPPORT_EMAIL)

  // Find project by slug
  const project = projects?.find((p) => createSlug(p.projectName) === slug)

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
