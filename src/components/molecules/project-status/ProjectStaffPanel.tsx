'use client'

import type { KeyboardEvent } from 'react'

import { useState } from 'react'

import type { Project } from '@/graphql/generated/graphql'

import { Button } from '@/components/atoms'
import { ProjectStatus } from '@/graphql/generated/graphql'
import { formatCardDate } from '@/utils'

import { ProjectInvoicesPanel } from '../admin/ProjectInvoicesPanel'
import { AssignToMeButton } from './AssignToMeButton'
import { PostUpdatePanel } from './PostUpdatePanel'

type StaffTab = 'update' | 'notes' | 'invoices'

type ProjectStaffPanelProps = {
  project: Project
  // Staff (admin or assigned developer) get the tabs; others may only see the assign button
  showTabs: boolean
  assignUserId?: string
  onAssigned: () => void
  status: ProjectStatus
  progress: number | null | undefined
  canViewInvoices: boolean
  canProvisionRepo: boolean
  provisioning: boolean
  onProvisionRepo: () => void
  onUpdated: (newStatus: ProjectStatus, newProgress: number | undefined) => void
}

const TAB_LABELS: Record<StaffTab, string> = {
  update: 'UPDATE',
  notes: 'NOTES',
  invoices: 'INVOICES',
}

// Solid fill shared by the open tab and the panel, so the tab fully covers the panel's top border and reads as one piece
const OPEN_FILL = 'bg-[color-mix(in_srgb,var(--color-yellow-400)_15%,black)]'

// Which tab is most useful on arrival: notes before taking a project, a deposit invoice before kickoff,
// updates while work is underway, the final invoice before handoff. Anything else stays collapsed.
const getDefaultTab = (
  status: ProjectStatus,
  hasDeveloper: boolean,
  tabs: StaffTab[]
): StaffTab | null => {
  const wanted = ((): StaffTab | null => {
    switch (status) {
      case ProjectStatus.Approved:
        return hasDeveloper ? 'invoices' : 'notes'
      case ProjectStatus.InProgress:
      case ProjectStatus.InTesting:
        return 'update'
      case ProjectStatus.ReadyForLaunch:
        return 'invoices'
      default:
        return null
    }
  })()

  return wanted && tabs.includes(wanted) ? wanted : null
}

// Staff-only workspace: everything an admin or assigned developer acts on, kept out of the client-facing column
export const ProjectStaffPanel = ({
  project,
  showTabs,
  assignUserId,
  onAssigned,
  status,
  progress,
  canViewInvoices,
  canProvisionRepo,
  provisioning,
  onProvisionRepo,
  onUpdated,
}: ProjectStaffPanelProps): React.ReactElement => {
  const tabs: StaffTab[] = canViewInvoices
    ? ['update', 'notes', 'invoices']
    : ['update', 'notes']
  // No tab selected means collapsed: the tabs stay put but nothing is open beneath them.
  // The default is picked once on load so the tab never jumps while someone is mid-edit.
  const [activeTab, setActiveTab] = useState<StaffTab | null>(() =>
    showTabs ? getDefaultTab(status, !!project.developerId, tabs) : null
  )

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!offset) return

    event.preventDefault()
    const current = activeTab ? tabs.indexOf(activeTab) : 0
    const next = tabs[(current + offset + tabs.length) % tabs.length]
    if (!next) return
    setActiveTab(next)
    document.getElementById(`staff-tab-${next}`)?.focus()
  }

  const internalDetails = [
    ['Priority', project.priority],
    ['Budget', project.budget ? `$${project.budget.toLocaleString()}` : null],
    ['Start', project.startDate ? formatCardDate(project.startDate) : null],
    [
      'Est. completion',
      project.estimatedCompletionDate
        ? formatCardDate(project.estimatedCompletionDate)
        : null,
    ],
  ]

  return (
    <section aria-label='Staff' className='mb-8'>
      {/* Title (flush left) and tabs; the one primary action (assign or provision) sits far right. With a tab open the tabs sit on the panel and the active one flows into it */}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-1'>
          <span className='py-1 pr-3 font-mono text-2xl font-bold tracking-wide text-yellow-400'>
            STAFF
          </span>
          {showTabs && (
            <div role='tablist' aria-label='Staff' className='flex gap-1'>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  id={`staff-tab-${tab}`}
                  type='button'
                  role='tab'
                  aria-selected={activeTab === tab}
                  aria-controls={`staff-panel-${tab}`}
                  tabIndex={
                    activeTab === tab || (!activeTab && tab === tabs[0])
                      ? 0
                      : -1
                  }
                  onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                  onKeyDown={handleTabKeyDown}
                  className={`relative rounded-t-lg border px-5 py-2.5 font-mono text-base font-bold transition-colors ${
                    activeTab ? '-mb-px border-b-0' : 'rounded-b-lg'
                  } ${
                    activeTab === tab
                      ? `z-10 border-yellow-400/30 ${OPEN_FILL} text-yellow-300`
                      : 'border-yellow-400/10 text-yellow-400/60 hover:bg-yellow-400/10 hover:text-yellow-400'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className='flex justify-end'>
          {assignUserId ? (
            <AssignToMeButton
              projectId={project.id}
              currentUserId={assignUserId}
              onAssigned={onAssigned}
            />
          ) : canProvisionRepo ? (
            <Button
              onClick={onProvisionRepo}
              disabled={provisioning}
              size='sm'
              className='py-1!'
            >
              {provisioning ? 'PROVISIONING...' : 'PROVISION REPO'}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Panels stay mounted so a half-written update survives collapsing or switching tabs */}
      {showTabs && (
        <div
          hidden={!activeTab}
          className={`rounded-lg border border-yellow-400/30 ${OPEN_FILL} p-4`}
        >
          <div
            id='staff-panel-update'
            role='tabpanel'
            aria-labelledby='staff-tab-update'
            hidden={activeTab !== 'update'}
          >
            <PostUpdatePanel
              projectId={project.id}
              currentStatus={status}
              currentProgress={progress}
              onSuccess={onUpdated}
            />
          </div>

          <div
            id='staff-panel-notes'
            role='tabpanel'
            aria-labelledby='staff-tab-notes'
            hidden={activeTab !== 'notes'}
            className='space-y-3'
          >
            <dl className='grid grid-cols-2 gap-3 font-mono text-sm sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none'>
              {internalDetails.map(([label, value]) =>
                value ? (
                  <div key={label}>
                    <dt className='text-xs text-yellow-300/60 uppercase'>
                      {label}
                    </dt>
                    <dd className='text-yellow-300'>{value}</dd>
                  </div>
                ) : null
              )}
            </dl>
            <div>
              <p className='text-xs text-yellow-300/60 uppercase'>
                Internal notes
              </p>
              <p className='font-mono text-sm whitespace-pre-wrap text-yellow-300/80'>
                {project.internalNotes || 'No internal notes.'}
              </p>
            </div>
          </div>

          {canViewInvoices && (
            <div
              id='staff-panel-invoices'
              role='tabpanel'
              aria-labelledby='staff-tab-invoices'
              hidden={activeTab !== 'invoices'}
            >
              <ProjectInvoicesPanel projectId={project.id} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
