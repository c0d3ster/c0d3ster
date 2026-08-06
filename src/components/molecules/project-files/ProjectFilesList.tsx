import type { GetProjectFilesQuery } from '@/graphql/generated/graphql'

type ProjectFileItem = GetProjectFilesQuery['projectFiles'][number]

type ProjectFilesListProps = {
  files: ReadonlyArray<ProjectFileItem>
}

export const ProjectFilesList = ({ files }: ProjectFilesListProps) => {
  if (files.length === 0) {
    return (
      <p className='py-8 text-center font-mono text-sm text-green-300/60'>
        No files uploaded yet
      </p>
    )
  }

  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {files.map((file) => (
        <div
          key={file.id}
          className='rounded border border-green-400/20 bg-black/40 p-3'
        >
          <div className='mb-1 flex items-center justify-between gap-2'>
            <p className='truncate font-mono text-sm text-green-400'>
              {file.originalFileName}
            </p>
            {file.placement && (
              <span className='shrink-0 rounded bg-green-400/10 px-2 py-0.5 font-mono text-xs text-green-400/70 uppercase'>
                {file.placement}
              </span>
            )}
          </div>
          {file.caption && (
            <p className='mb-2 font-mono text-xs text-green-300/70 italic'>
              {file.caption}
            </p>
          )}
          {file.downloadUrl && (
            <a
              href={file.downloadUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='font-mono text-xs text-green-400 underline hover:text-green-300'
            >
              Download
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
