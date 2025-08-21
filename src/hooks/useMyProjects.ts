'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

import type { ProjectItem } from '@/types'

type ProjectsSummary = {
  totalRequests: number
  totalProjects: number
  pendingRequests: number
  activeProjects: number
}

type UseMyProjectsReturn = {
  items: ProjectItem[]
  summary: ProjectsSummary
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export const useMyProjects = (): UseMyProjectsReturn => {
  const { isSignedIn } = useAuth()
  const [items, setItems] = useState<ProjectItem[]>([])
  const [summary, setSummary] = useState<ProjectsSummary>({
    totalRequests: 0,
    totalProjects: 0,
    pendingRequests: 0,
    activeProjects: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    if (!isSignedIn) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/my-projects')

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setItems(data.items || [])
      setSummary(
        data.summary || {
          totalRequests: 0,
          totalProjects: 0,
          pendingRequests: 0,
          activeProjects: 0,
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    summary,
    isLoading,
    error,
    refetch: fetchProjects,
  }
}
