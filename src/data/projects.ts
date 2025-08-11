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
  },
  {
    title: 'AI Generation Platform',
    overview: 'Advanced AI-powered platform for creating videos and images',
    tech: ['React', 'TypeScript', 'LoRAs', 'ML Models'],
    status: 'COMPLETED',
    logo: '/assets/images/KaiberLogo.png',
    projectName: 'Kaiber.ai',
    projectUrl: 'https://kaiber.ai',
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
  },
]

// Map project names to slugs for URL generation
export const projectNameToSlug: Record<string, string> = {
  BALLZ: 'ballz',
  'Kaiber.ai': 'kaiber',
  Fractaleyez: 'fractaleyez',
}
