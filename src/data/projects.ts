import type { Project } from '@/components/molecules'

export const defaultFeaturedProjects: Project[] = [
  {
    title: 'Cross-Platform 3D Game',
    overview: 'Multi-platform 3D action game built with Unity Engine',
    tech: ['Unity', 'C#', 'Firebase', '3D Graphics'],
    status: 'IN PROGRESS',
    logo: '/assets/images/BALLZLogo.png',
    projectName: 'BALLZ',
    projectUrl: '/ballz',
    description:
      'BALLZ is an immersive 3D action game that combines fast-paced gameplay with strategic elements. Built using Unity Engine, this cross-platform title features dynamic 3D environments, responsive controls, and engaging gameplay mechanics that challenge players to think quickly while maintaining precision.',
  },
  {
    title: 'AI Generation Platform',
    overview: 'Advanced AI-powered platform for creating videos and images',
    tech: ['React', 'TypeScript', 'LoRAs', 'ML Models'],
    status: 'COMPLETED',
    logo: '/assets/images/KaiberLogo.png',
    projectName: 'Kaiber.ai',
    projectUrl: 'https://kaiber.ai',
    description:
      'Made for artists, by artists, we are an AI creative lab on a mission to unlock creativity through powerful and intuitive generative audio and video. Built to enable creativity, not replace it, Kaiber explores the intersection of artistry and technology, with endless possibilities.',
  },
  {
    title: 'Interactive Audio Visualizer',
    overview:
      'Fully customizable audio-reactive visualizer with real-time effects',
    tech: ['Three.js', 'MongoDB', 'WebGL', 'Audio API'],
    status: 'COMPLETED',
    logo: '/assets/images/FractaleyezLogo.png',
    projectName: 'Fractaleyez',
    projectUrl: 'https://fractaleyez.com',
    description:
      'Fractaleyez is an easy-to-use, fully configurable, realtime music visualizer that transforms audio into stunning visual experiences. Built with modern web technologies, it provides artists and creators with powerful tools to create immersive audio-visual performances and installations.',
  },
]

// Map project names to slugs for URL generation
export const projectNameToSlug: Record<string, string> = {
  BALLZ: 'ballz',
  'Kaiber.ai': 'kaiber',
  Fractaleyez: 'fractaleyez',
}
