'use client'

type CleanPageTemplateProps = {
  children: React.ReactNode
}

export const CleanPageTemplate = ({ children }: CleanPageTemplateProps) => {
  return <div className='min-h-screen bg-black pt-32'>{children}</div>
}
