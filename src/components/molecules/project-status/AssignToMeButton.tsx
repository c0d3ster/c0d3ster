'use client'

import { useAssignProject } from '@/apiClients'
import { Button } from '@/components/atoms'
import { Toast } from '@/libs/Toast'

type AssignToMeButtonProps = {
  projectId: string
  currentUserId: string
  onAssigned: () => void
}

// Lets a developer or admin take an approved, unowned project; the parent only renders it while that holds
export const AssignToMeButton = ({
  projectId,
  currentUserId,
  onAssigned,
}: AssignToMeButtonProps): React.ReactElement => {
  const [assignProject, { loading }] = useAssignProject()

  const handleAssign = async (): Promise<void> => {
    try {
      await assignProject({
        variables: { projectId, developerId: currentUserId },
      })
      Toast.success('Successfully assigned to project!')
      onAssigned()
    } catch (error) {
      Toast.error('Failed to assign to project')
      console.error('Assign project error:', error)
    }
  }

  return (
    <Button
      onClick={handleAssign}
      disabled={loading}
      size='sm'
      className='py-1!'
    >
      {loading ? 'ASSIGNING...' : 'ASSIGN TO ME'}
    </Button>
  )
}
