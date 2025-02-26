"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// Dynamic imports for Next.js
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false })
const MobileLayout = dynamic(() => import('@/components/MobileLayout'), { ssr: false })

export default function ResearchPage() {
  return (
    <main className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">Loading Research Visualization...</div>}>
        <MobileLayout>
          <Canvas
            camera={{ position: [0, 0, 15], fov: 75 }}
            gl={{ antialias: true }}
            style={{ 
              background: 'black',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh'
            }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            
            <Scene />
            
            <OrbitControls
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              autoRotate={false}
              minDistance={5}
              maxDistance={50}
              dampingFactor={0.1}
              enableDamping={true}
            />
          </Canvas>
        </MobileLayout>
      </Suspense>
      
      {/* Add a direct link back to home */}
      <div className="fixed top-4 left-4 z-50">
        <a href="/" className="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back to Home</span>
        </a>
      </div>
    </main>
  )
} 