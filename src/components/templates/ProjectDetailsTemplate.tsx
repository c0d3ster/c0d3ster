'use client'

import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { FaPencilAlt } from 'react-icons/fa'

import type { GetProjectBySlugQuery } from '@/graphql/generated/graphql'

import { useGetFile, useGetMe } from '@/apiClients'
import {
  BackButton,
  Button,
  ExpandingUnderline,
  ScrollFade,
} from '@/components/atoms'
import { AnimatedHeading, LogoUpload } from '@/components/molecules'
import { formatStatus, getStatusCardStyling } from '@/utils'

import { CleanPageTemplate } from './CleanPageTemplate'

// Type alias for the complete Project from the query
type Project = NonNullable<GetProjectBySlugQuery['projectBySlug']>

type ProjectDetailsTemplateProps = {
  project: Project
}

export const ProjectDetailsTemplate = ({
  project,
}: ProjectDetailsTemplateProps) => {
  const { user, isLoaded } = useUser()
  const { data: meData, loading: meLoading } = useGetMe()
  const [showLogoUpload, setShowLogoUpload] = useState(false)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(
    project.logo || null
  )
  const setCurrentLogoUrlRef = useRef(setCurrentLogoUrl)

  // Check if the project logo is a public URL or a storage key
  const isPublicUrl = (url?: string | null) =>
    !!url && (/^https?:\/\//.test(url) || url.startsWith('/assets/'))

  // Use the current logo URL if set, otherwise fall back to the project logo
  const displayLogo =
    currentLogoUrl || (isPublicUrl(project.logo) ? project.logo : undefined)

  // Get download URL for non-public storage keys
  const shouldFetchFile = project.logo && !isPublicUrl(project.logo)
  const { data: fileData } = useGetFile(shouldFetchFile ? project.logo : '')

  // Update current logo URL when file data is loaded
  useEffect(() => {
    if (shouldFetchFile && fileData?.file?.downloadUrl && !currentLogoUrl) {
      setCurrentLogoUrlRef.current(fileData.file.downloadUrl)
    }
  }, [shouldFetchFile, fileData?.file?.downloadUrl, currentLogoUrl])

  // Check if current user can edit this project (is client or developer)
  // Only check after user data is loaded to avoid showing upload component briefly
  // Compare database user IDs properly
  const canEditProject =
    isLoaded &&
    !meLoading &&
    user &&
    meData?.me &&
    (meData.me.id === project.clientId || meData.me.id === project.developerId)

  // Check if user is the client (for personalized messages)
  const isClient = meData?.me?.id === project.clientId

  const handleLogoUploaded = (logoUrl: string) => {
    // Update the logo URL directly with the presigned URL from the mutation
    setCurrentLogoUrl(logoUrl)
    setShowLogoUpload(false)
  }

  return (
    <CleanPageTemplate>
      <BackButton useBack text='BACK' />
      <div className='container mx-auto px-4'>
        {/* Project Header */}
        <ScrollFade>
          <div className='mb-16 text-center'>
            <AnimatedHeading
              text={project.projectName}
              level='h1'
              variant='section'
              className='mb-4'
            />
            <ExpandingUnderline />
            <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
              {project.title ?? project.projectName}
            </p>
            <p className='mt-4 font-mono text-base text-green-400 opacity-70'>
              {project.overview}
            </p>
          </div>
        </ScrollFade>

        {/* Project Content */}
        <div className='grid gap-12 lg:grid-cols-2'>
          {/* Project Logo and Visual */}
          <ScrollFade>
            <div className='flex flex-col items-center space-y-8'>
              <div className='relative'>
                {displayLogo && !showLogoUpload ? (
                  <div className='group relative'>
                    <div className='relative overflow-hidden rounded-lg'>
                      <Image
                        src={displayLogo}
                        alt={`${project.title ?? project.projectName} logo`}
                        width={300}
                        height={300}
                        sizes='300px'
                        className='rounded-lg border border-green-400/20 bg-black/80 p-8 transition-all duration-300'
                        priority
                      />
                      {canEditProject && (
                        <div className='absolute inset-0 rounded-lg bg-green-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                      )}
                    </div>
                    {canEditProject && (
                      <button
                        type='button'
                        onClick={() => setShowLogoUpload(true)}
                        className='absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-green-500/40 hover:text-green-300'
                        title='Edit logo'
                      >
                        <FaPencilAlt className='h-3 w-3' />
                      </button>
                    )}
                  </div>
                ) : !isLoaded || meLoading ? (
                  <div className='flex h-[300px] w-[300px] items-center justify-center rounded-lg border border-green-400/20 bg-black/80 p-8'>
                    <div className='text-center'>
                      <div className='mx-auto h-8 w-8 animate-spin rounded-full border-2 border-green-400 border-t-transparent'></div>
                      <p className='mt-2 font-mono text-xs text-green-400/70'>
                        Checking permissions...
                      </p>
                    </div>
                  </div>
                ) : canEditProject ? (
                  <div className='flex h-[300px] w-[300px] flex-col items-center justify-center rounded-lg border border-green-400/20 bg-black/80 p-8'>
                    <LogoUpload
                      projectId={project.id}
                      onLogoUploadedAction={handleLogoUploaded}
                      showCancel={showLogoUpload}
                    />
                    {!showLogoUpload && (
                      <p className='mt-2 text-center font-mono text-xs text-green-400/70'>
                        {isClient
                          ? 'Upload your project logo'
                          : 'Upload project logo as developer'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className='flex h-[300px] w-[300px] flex-col items-center justify-center rounded-lg border border-green-400/20 bg-black/80 p-8'>
                    <Image
                      src='/assets/images/c0d3sterLogoPowerNoBackgroundCropped.png'
                      alt='c0d3ster logo placeholder'
                      width={200}
                      height={200}
                      className='opacity-20'
                    />
                    <p className='mt-4 text-center font-mono text-xs text-green-400/50'>
                      No project logo available
                    </p>
                    <p className='mt-1 text-center font-mono text-xs text-green-400/30'>
                      Logo upload is restricted to the project owner or assigned
                      developer
                    </p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className='text-center'>
                <span
                  className={`inline-block rounded-full border px-6 py-3 font-mono text-sm font-bold ${getStatusCardStyling(project.status)}`}
                >
                  {formatStatus(project.status)}
                </span>
              </div>
            </div>
          </ScrollFade>

          {/* Project Details */}
          <ScrollFade>
            <div className='space-y-8'>
              {/* Tech Stack */}
              {(project.techStack ?? []).filter(
                (t: string | null | undefined): t is string => Boolean(t)
              ).length > 0 && (
                <div>
                  <h3 className='mb-4 font-mono text-xl font-bold text-green-400'>
                    TECHNOLOGIES USED
                  </h3>
                  <div className='flex flex-wrap gap-3'>
                    {(project.techStack ?? [])
                      .filter((t: string | null | undefined): t is string =>
                        Boolean(t)
                      )
                      .map((tech: string) => (
                        <span
                          key={tech}
                          className='rounded border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm text-green-400'
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Project Description */}
              <div>
                <h3 className='mb-4 font-mono text-xl font-bold text-green-400'>
                  PROJECT DETAILS
                </h3>
                <p className='font-mono leading-relaxed text-green-300 opacity-90'>
                  {project.description || 'Project details coming soon...'}
                </p>
              </div>
            </div>
          </ScrollFade>
        </div>

        {/* Access Project Button */}
        {project.liveUrl && (
          <ScrollFade>
            <div className='mt-16 text-center'>
              <Button
                href={project.liveUrl}
                external={project.liveUrl.startsWith('http')}
                size='md'
              >
                ACCESS PROJECT
              </Button>
            </div>
          </ScrollFade>
        )}
      </div>
    </CleanPageTemplate>
  )
}
