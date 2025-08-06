'use client'

type SectionWrapperProps = {
  children: React.ReactNode
  id: string
  className?: string
}

export const SectionWrapper = ({ children, id, className = '' }: SectionWrapperProps) => {
  return (
    <section id={id} className={`min-h-screen bg-black py-16 ${className}`}>
      <div className='container mx-auto px-4 pt-4'>
        {children}
      </div>
    </section>
  )
} 