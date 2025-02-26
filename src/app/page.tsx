"use client"

import dynamic from 'next/dynamic'
import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Link from 'next/link'

// Dynamic imports for Next.js
const TopicWords = dynamic(() => import('@/components/TopicWords'), { ssr: false })
const MatrixRain = dynamic(() => import('@/components/MatrixRain'), { ssr: false })
const InteractiveBackground = dynamic(() => import('@/components/InteractiveBackground'), { ssr: false })
const CameraController = dynamic(() => import('@/components/CameraController'), { ssr: false })
const ReturnButton3D = dynamic(() => import('@/components/ReturnButton3D'), { ssr: false })

// Topic positions for the matrix rain transformation
const topicPositions: { [key: string]: [number, number, number] } = {
  "Agents": [10, 0, -5],
  "Embeddings": [-8, 5, 0],
  "Leadership": [0, -5, 10],
  "Consciousness": [5, 10, 0],
  "Cognition": [-10, 0, 5],
  "Emergence": [0, 8, -10]
}

export default function Home() {
  const [focusedTopic, setFocusedTopic] = useState<string | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const controlsRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle controls change
  const handleControlsChange = () => {
    setIsInteracting(true)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set a new timeout to reset interaction state
    timeoutRef.current = setTimeout(() => {
      setIsInteracting(false)
    }, 2000)
  }
  
  // Reset focused topic
  const handleResetView = () => {
    setFocusedTopic(null);
  }
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Add global styles to ensure full black background
  useEffect(() => {
    // Add styles to html and body to ensure full black background
    document.documentElement.style.backgroundColor = 'black'
    document.documentElement.style.margin = '0'
    document.documentElement.style.padding = '0'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100%'
    
    document.body.style.backgroundColor = 'black'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100%'
    
    return () => {
      // Clean up styles when component unmounts
      document.documentElement.style.removeProperty('background-color')
      document.documentElement.style.removeProperty('margin')
      document.documentElement.style.removeProperty('padding')
      document.documentElement.style.removeProperty('overflow')
      document.documentElement.style.removeProperty('height')
      
      document.body.style.removeProperty('background-color')
      document.body.style.removeProperty('margin')
      document.body.style.removeProperty('padding')
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('height')
    }
  }, [])

  return (
    <main className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">Loading...</div>}>
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
          
          <InteractiveBackground />
          <MatrixRain 
            focusedTopic={focusedTopic} 
            topicPositions={topicPositions} 
          />
          <TopicWords 
            topics={Object.keys(topicPositions)} 
            onFocus={setFocusedTopic} 
            focusedTopic={focusedTopic}
          />
          
          {/* 3D Return Button - only visible when a topic is focused */}
          {focusedTopic && (
            <ReturnButton3D onReturn={handleResetView} topicName={focusedTopic} />
          )}
          
          <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            autoRotate={!isInteracting}
            autoRotateSpeed={0.5}
            minDistance={5}
            maxDistance={50}
            dampingFactor={0.1}
            enableDamping={true}
            onChange={handleControlsChange}
          />
          
          <CameraController isInteracting={isInteracting} />
        </Canvas>
      </Suspense>
      
      {/* GitHub link */}
      <div className="fixed bottom-4 right-4 z-50">
        <a 
          href="https://github.com/bpacton/personal_site_2" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white opacity-50 hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </a>
      </div>
    </main>
  )
}
