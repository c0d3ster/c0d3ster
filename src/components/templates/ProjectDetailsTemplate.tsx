'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useOptimistic, useRef, useState } from 'react'
import { FaPencilAlt, FaRegStar, FaStar } from 'react-icons/fa'

import type { Project } from '@/graphql/generated/graphql'

import { useGetFile, useGetMe, useProvisionProjectRepo, useUpdateProject } from '@/apiClients'
import {
  BackButton,
  Button,
  ExpandingUnderline,
  ScrollFade,
} from '@/components/atoms'
import {
  AnimatedHeading,
  LogoUpload,
  PostUpdatePanel,
  StatusHistory,
} from '@/components/molecules'
import { ProjectStatus, UserRole } from '@/graphql/generated/graphql'
import { Toast } from '@/libs/Toast'
import { formatStatus, getStatusCardStyling } from '@/utils'

import { CleanPageTemplate } from './CleanPageTemplate'

type ProjectDetailsTemplateProps = {
  project: Project
}

export const ProjectDetailsTemplate = ({
  project,
}: ProjectDetailsTemplateProps) => {
  const router = useRouter()
  const { data: meData, loading: meLoading } = useGetMe()
  const [provisionProjectRepo, { loading: provisioning }] =
    useProvisionProjectRepo()
  const [updateProject, { loading: updatingFeatured }] = useUpdateProject()
  const [repoUrl, setRepoUrl] = useState<string | null>(
    project.repositoryUrl || null
  )
  const [stagingUrl, setStagingUrl] = useState<string | null>(
    project.stagingUrl || null
  )
  const [featured, setFeatured] = useState(project.featured)
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(project.status)
  const [optimisticProgress, setOptimisticProgress] = useOptimistic(project.progressPercentage)
  const [showLogoUpload, setShowLogoUpload] = useState(false)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(
    project.logo || null
  )
  const [liveUrl, setLiveUrl] = useState<string>(project.liveUrl || '')
  const [editingLiveUrl, setEditingLiveUrl] = useState(false)
  const [liveUrlDraft, setLiveUrlDraft] = useState<string>(project.liveUrl || '')
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
    !meLoading &&
    meData?.me &&
    (meData.me.id === project.clientId || meData.me.id === project.developerId)

  // Check if user is the client (for personalized messages)
  const isClient = meData?.me?.id === project.clientId

  // Only admins or the assigned developer (with Developer role) can provision a repo,
  // and only once a developer is assigned and the project is approved or in progress.
  const provisionableStatuses = [ProjectStatus.Approved, ProjectStatus.InProgress]
  const canProvisionRepo =
    !meLoading &&
    meData?.me &&
    (meData.me.role === UserRole.Admin ||
      meData.me.role === UserRole.SuperAdmin ||
      (meData.me.role === UserRole.Developer &&
        meData.me.id === project.developerId)) &&
    !!project.developerId &&
    provisionableStatuses.includes(optimisticStatus as ProjectStatus) &&
    !repoUrl

  const canPostUpdate =
    !meLoading &&
    meData?.me &&
    (meData.me.role === UserRole.Admin ||
      meData.me.role === UserRole.SuperAdmin ||
      (meData.me.role === UserRole.Developer &&
        meData.me.id === project.developerId))

  const canManageFeatured =
    !meLoading &&
    meData?.me &&
    (meData.me.role === UserRole.Admin ||
      meData.me.role === UserRole.SuperAdmin)

  const handleProvisionRepo = async () => {
    try {
      const result = await provisionProjectRepo({
        variables: { projectId: project.id },
      })
      const provisioned = result.data?.provisionProjectRepo
      if (provisioned?.repositoryUrl) {
        setRepoUrl(provisioned.repositoryUrl)
      }
      if (provisioned?.stagingUrl) {
        setStagingUrl(provisioned.stagingUrl)
      }
      if (provisioned?.repositoryUrl && provisioned?.stagingUrl) {
        Toast.success('Repository and staging environment provisioned!')
      } else if (provisioned?.repositoryUrl) {
        Toast.success('Repository provisioned!')
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to provision repository'
      Toast.error(message)
    }
  }

  const handleLogoUploaded = (logoUrl: string) => {
    // Update the logo URL directly with the presigned URL from the mutation
    setCurrentLogoUrl(logoUrl)
    setShowLogoUpload(false)
  }

  const handleSaveLiveUrl = async () => {
    const trimmed = liveUrlDraft.trim()
    try {
      await updateProject({ variables: { id: project.id, liveUrl: trimmed || null } })
      setLiveUrl(trimmed)
      setEditingLiveUrl(false)
    } catch {
      Toast.error('Failed to save live URL')
    }
  }

  const handleToggleFeatured = async () => {
    const next = !featured
    setFeatured(next)
    try {
      await updateProject({ variables: { id: project.id, featured: next } })
    } catch {
      setFeatured(!next)
      Toast.error('Failed to update featured status')
    }
  }

  return (
    <CleanPageTemplate>
      <BackButton useBack text='BACK' />
      <div className='container mx-auto px-4 pb-8 md:pb-12'>
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
                ) : meLoading ? (
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

              {/* People */}
              <div className='w-[300px] space-y-4'>
                {([
                  { label: 'CLIENT', user: project.client },
                  { label: 'DEVELOPER', user: project.developer },
                ] as const).map(({ label, user }) => {
                  const initials = user
                    ? (`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
                        .toUpperCase() || '?')
                    : null
                  const fullName = user
                    ? ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email)
                    : null
                  return (
                    <div key={label} className='flex items-center gap-3'>
                      <span className='w-20 font-mono text-xs text-green-400/50'>{label}</span>
                      {user ? (
                        <>
                          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-400/20 bg-green-400/10 font-mono text-xs text-green-400'>
                            {initials}
                          </div>
                          <span className='font-mono text-sm text-green-300'>{fullName}</span>
                        </>
                      ) : (
                        <span className='font-mono text-sm text-green-400/40'>UNASSIGNED</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Status Badge */}
              <div className='text-center'>
                <span
                  className={`inline-block rounded-full border px-6 py-3 font-mono text-sm font-bold ${getStatusCardStyling(optimisticStatus)}`}
                >
                  {formatStatus(optimisticStatus)}
                </span>
              </div>

              {/* Repo / Staging / Live links */}
              {(repoUrl || canProvisionRepo || stagingUrl || liveUrl || canPostUpdate) && (
                <div className='flex w-[300px] flex-col gap-3'>
                  {repoUrl ? (
                    <Button href={repoUrl} external size='md'>
                      VIEW REPOSITORY
                    </Button>
                  ) : canProvisionRepo ? (
                    <Button
                      onClick={handleProvisionRepo}
                      disabled={provisioning}
                      size='md'
                    >
                      {provisioning ? 'PROVISIONING...' : 'PROVISION REPO'}
                    </Button>
                  ) : null}
                  {stagingUrl && (
                    <Button href={stagingUrl} external size='md'>
                      VIEW STAGING
                    </Button>
                  )}
                  {liveUrl && !editingLiveUrl && (
                    <div className='group relative'>
                      <Button
                        href={liveUrl}
                        external={liveUrl.startsWith('http')}
                        size='md'
                      >
                        ACCESS PROJECT
                      </Button>
                      {canPostUpdate && (
                        <button
                          type='button'
                          onClick={() => { setLiveUrlDraft(liveUrl); setEditingLiveUrl(true) }}
                          className='absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-green-500/20 text-green-400 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-green-500/40'
                          title='Edit live URL'
                        >
                          <FaPencilAlt className='h-3 w-3' />
                        </button>
                      )}
                    </div>
                  )}
                  {canPostUpdate && editingLiveUrl && (
                    <div className='flex flex-col gap-2'>
                      <input
                        type='url'
                        value={liveUrlDraft}
                        onChange={(e) => setLiveUrlDraft(e.target.value)}
                        placeholder='https://...'
                        className='w-full rounded border border-green-400/30 bg-black/50 px-3 py-2 font-mono text-sm text-green-400 placeholder-green-600 focus:border-green-400 focus:outline-none'
                      />
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          onClick={handleSaveLiveUrl}
                          className='flex-1 rounded border border-green-400/30 bg-green-400/10 px-3 py-1.5 font-mono text-xs text-green-400 hover:bg-green-400 hover:text-black'
                        >
                          SAVE
                        </button>
                        <button
                          type='button'
                          onClick={() => setEditingLiveUrl(false)}
                          className='flex-1 rounded border border-green-400/10 bg-black/40 px-3 py-1.5 font-mono text-xs text-green-400/50 hover:bg-green-400/10'
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                  {canPostUpdate && !liveUrl && !editingLiveUrl && (
                    <button
                      type='button'
                      onClick={() => { setLiveUrlDraft(''); setEditingLiveUrl(true) }}
                      className='w-full rounded border border-green-400/10 bg-black/20 px-3 py-2 font-mono text-xs text-green-400/40 hover:border-green-400/30 hover:text-green-400/70'
                    >
                      + SET LIVE URL
                    </button>
                  )}
                </div>
              )}
            </div>
          </ScrollFade>

          {/* Project Details */}
          <ScrollFade>
            <div className='space-y-8'>
              {/* Featured toggle — admin only (controls public portfolio) */}
              {canManageFeatured && (
                <div className='flex justify-end'>
                  <button
                    type='button'
                    onClick={handleToggleFeatured}
                    disabled={updatingFeatured}
                    className='cursor-pointer text-green-600 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40'
                    title={featured ? 'Remove from featured' : 'Add to featured'}
                    aria-label={featured ? 'Remove from featured' : 'Add to featured'}
                    aria-pressed={featured}
                  >
                    {featured
                      ? <FaStar className='h-5 w-5' />
                      : <FaRegStar className='h-5 w-5' />}
                  </button>
                </div>
              )}

              {/* Post update — primary action for admins / assigned dev */}
              {canPostUpdate && (
                <PostUpdatePanel
                  projectId={project.id}
                  currentStatus={optimisticStatus}
                  currentProgress={optimisticProgress}
                  onSuccess={(newStatus, newProgress) => {
                    startTransition(() => {
                      setOptimisticStatus(newStatus)
                      if (newProgress !== undefined) setOptimisticProgress(newProgress)
                      router.refresh()
                    })
                  }}
                />
              )}

              {/* Completion */}
              {optimisticProgress != null && optimisticProgress < 100 && (
                <div className='space-y-2'>
                  <h3 className='font-mono text-xl font-bold text-green-400'>
                    COMPLETION
                  </h3>
                  <div className='flex justify-between font-mono text-sm'>
                    <span className='text-green-300/60'>Progress</span>
                    <span className='text-green-400'>
                      {Math.round(optimisticProgress)}%
                    </span>
                  </div>
                  <div className='h-2 w-full rounded-full bg-green-400/20'>
                    <div
                      className='h-full max-w-full rounded-full bg-green-400 transition-all duration-300'
                      style={{
                        width: `${Math.min(100, Math.max(0, optimisticProgress))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

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

              {/* Status History */}
              <StatusHistory
                statusUpdates={project.statusUpdates || []}
                hideInternal={!canPostUpdate}
              />
            </div>
          </ScrollFade>
        </div>

      </div>
    </CleanPageTemplate>
  )
}
