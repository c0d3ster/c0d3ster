import type { Metadata } from 'next'

import {
  BackButton,
  ExpandingUnderline,
  TypewriterEffect,
} from '@/components/atoms'
import { AnimatedHeading } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'BALLZ - Cross-Platform 3D Game',
  description: 'Multi-platform 3D action game built with Unity Engine',
}

export default function Ballz() {
  return (
    <CleanPageTemplate>
      <BackButton href='/projects' text='BACK TO PROJECTS' />
      <div className='container mx-auto px-4'>
        {/* Project Header */}
        <div className='mb-16 text-center'>
          <AnimatedHeading
            text='BALLZ'
            level='h1'
            variant='section'
            className='mb-4'
          />
          <ExpandingUnderline />
          <p className='mt-6 font-mono text-lg text-green-300 opacity-80'>
            Cross-Platform 3D Game
          </p>
          <p className='mt-4 font-mono text-base text-green-400 opacity-70'>
            Multi-platform 3D action game built with Unity Engine
          </p>
        </div>

        {/* Project Content */}
        <div className='mx-auto max-w-4xl space-y-12'>
          {/* Project Overview */}
          <div className='text-center'>
            <h2 className='mb-6 font-mono text-2xl font-bold text-green-400'>
              PROJECT OVERVIEW
            </h2>
            <p className='font-mono leading-relaxed text-green-300 opacity-90'>
              BALLZ is an immersive 3D action game that combines fast-paced
              gameplay with stunning visual effects. Built using Unity Engine,
              the game features cross-platform compatibility and real-time
              multiplayer capabilities.
            </p>
          </div>

          {/* Game Features */}
          <div>
            <h3 className='mb-6 text-center font-mono text-xl font-bold text-green-400'>
              GAME FEATURES
            </h3>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='rounded border border-green-400/20 bg-black/40 p-6'>
                <h4 className='mb-3 font-mono font-bold text-green-400'>
                  3D Graphics
                </h4>
                <p className='font-mono text-sm text-green-300 opacity-80'>
                  Advanced rendering with dynamic lighting and particle effects
                </p>
              </div>
              <div className='rounded border border-green-400/20 bg-black/40 p-6'>
                <h4 className='mb-3 font-mono font-bold text-green-400'>
                  Multiplayer
                </h4>
                <p className='font-mono text-sm text-green-300 opacity-80'>
                  Real-time multiplayer with Firebase backend integration
                </p>
              </div>
              <div className='rounded border border-green-400/20 bg-black/40 p-6'>
                <h4 className='mb-3 font-mono font-bold text-green-400'>
                  Cross-Platform
                </h4>
                <p className='font-mono text-sm text-green-300 opacity-80'>
                  Available on PC, mobile, and console platforms
                </p>
              </div>
              <div className='rounded border border-green-400/20 bg-black/40 p-6'>
                <h4 className='mb-3 font-mono font-bold text-green-400'>
                  Physics Engine
                </h4>
                <p className='font-mono text-sm text-green-300 opacity-80'>
                  Realistic physics simulation for immersive gameplay
                </p>
              </div>
            </div>
          </div>

          {/* Development Status */}
          <div className='text-center'>
            <h3 className='mb-6 font-mono text-xl font-bold text-green-400'>
              DEVELOPMENT STATUS
            </h3>
            <div className='inline-block rounded border border-yellow-400/40 bg-yellow-400/20 px-8 py-3'>
              <span className='font-mono text-sm font-bold text-yellow-400'>
                IN PROGRESS
              </span>
            </div>
            <p className='mt-4 font-mono text-sm text-green-300 opacity-70'>
              Expected completion: Q2 2024
            </p>
          </div>

          {/* Matrix-style info */}
          <div className='text-center font-mono text-sm text-green-600 opacity-40'>
            <p>
              <TypewriterEffect
                text='GAME ENGINE: UNITY 2022.3 LTS'
                speed={65}
              />
            </p>
            <p>
              <TypewriterEffect text='DEVELOPMENT TIME: 8 MONTHS' speed={65} />
            </p>
            <p>
              <TypewriterEffect text='TEAM SIZE: 4 DEVELOPERS' speed={65} />
            </p>
          </div>
        </div>
      </div>
    </CleanPageTemplate>
  )
}
