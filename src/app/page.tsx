"use client"

import dynamic from 'next/dynamic'
import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// Dynamic imports for Next.js
const TopicWords = dynamic(() => import('@/components/TopicWords'), { ssr: false })
const MatrixRain = dynamic(() => import('@/components/MatrixRain'), { ssr: false })
const InteractiveBackground = dynamic(() => import('@/components/InteractiveBackground'), { ssr: false })
const CameraController = dynamic(() => import('@/components/CameraController'), { ssr: false })

// Topic positions for the matrix rain transformation
const topicPositions = {
  "Agents": [5, 2, -3],
  "Embeddings": [-4, 3, 2],
  "Leadership": [0, 5, 4],
  "Consciousness": [3, -2, 5],
  "Cognition": [-5, 0, -3],
  "Emergence": [2, 4, -2]
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
    </main>
  )
}
