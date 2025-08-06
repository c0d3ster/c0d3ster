'use client'

export const Portfolio = () => {
  const projects = [
    {
      title: 'E-Commerce Platform',
      description: 'Full-stack React/Next.js application with TypeScript',
      tech: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      status: 'COMPLETED',
    },
    {
      title: 'Real-time Dashboard',
      description: 'Analytics dashboard with real-time data visualization',
      tech: ['React', 'Node.js', 'Socket.io', 'Chart.js'],
      status: 'IN PROGRESS',
    },
    {
      title: 'API Gateway',
      description: 'Microservices architecture with authentication',
      tech: ['Node.js', 'Express', 'JWT', 'MongoDB'],
      status: 'COMPLETED',
    },
  ]

  return (
    <section id='portfolio' className='min-h-screen bg-black py-16'>
      <div className='container mx-auto px-4'>
        {/* Section Header */}
        <div className='mb-12 text-center'>
          <h2 className='relative m-4 font-mono text-5xl font-bold text-green-400 md:text-6xl'>
            PORTFOLIO
          </h2>
          <div className='relative mx-auto h-1 w-32 bg-green-400' />
          <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
            SELECTED PROJECTS & ACHIEVEMENTS
          </p>
        </div>

        {/* Projects Grid */}
        <div className='mb-8 grid gap-16 md:grid-cols-2 lg:grid-cols-3'>
          {projects.map((project) => (
            <div
              key={project.title}
              className='group relative overflow-hidden rounded-lg border border-green-400/20 bg-black/50 p-6 transition-all duration-300 hover:border-green-400/40 hover:bg-green-400/5'
            >
              {/* Status Badge */}
              <div className='absolute top-4 right-4'>
                <span className='rounded-full bg-green-400/20 px-3 py-1 font-mono text-xs text-green-400'>
                  {project.status}
                </span>
              </div>

              {/* Project Content */}
              <div className='mt-8'>
                <h3 className='mb-3 font-mono text-xl font-bold text-green-400'>
                  {project.title}
                </h3>
                <p className='mb-4 font-mono text-sm text-green-300 opacity-80'>
                  {project.description}
                </p>

                {/* Tech Stack */}
                <div className='flex flex-wrap gap-2'>
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className='rounded border border-green-400/30 bg-green-400/10 px-2 py-1 font-mono text-xs text-green-400'
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Matrix-style decorative elements */}
              <div className='absolute bottom-4 left-4 opacity-20'>
                <div className='h-8 w-1 bg-green-400' />
              </div>
              <div className='absolute right-4 bottom-4 opacity-20'>
                <div className='h-8 w-1 bg-green-500' />
              </div>
            </div>
          ))}
        </div>

        {/* Additional Matrix-style info */}
        <div className='mt-16 text-center font-mono text-sm text-green-600 opacity-40'>
          <p>
            PROJECTS LOADED:
            {projects.length}
          </p>
          <p>SUCCESS RATE: 100%</p>
          <p>CLIENT SATISFACTION: EXCELLENT</p>
        </div>
      </div>
    </section>
  )
}
