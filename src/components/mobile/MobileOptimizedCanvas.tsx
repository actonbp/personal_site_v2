"use client"

import { ReactNode, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import dynamic from 'next/dynamic'

// Dynamically import mobile components
const MobileThreeSupport = dynamic(() => import('./MobileThreeSupport'), { ssr: false })
const MobileTouchControls = dynamic(() => import('./MobileTouchControls'), { ssr: false })
const MobileOrbitControls = dynamic(() => import('./MobileOrbitControls'), { ssr: false })

// Dynamically import OrbitControls for desktop
const OrbitControls = dynamic(() => 
  import('@react-three/drei').then((mod) => mod.OrbitControls), 
  { ssr: false }
)

interface MobileOptimizedCanvasProps {
  children: ReactNode
  className?: string
  camera?: { position: [number, number, number], fov?: number }
  enableOrbitControls?: boolean
  enableTouchControls?: boolean
  enableDamping?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  autoRotate?: boolean
}

export default function MobileOptimizedCanvas({
  children,
  className,
  camera = { position: [0, 0, 10], fov: 75 },
  enableOrbitControls = true,
  enableTouchControls = true,
  enableDamping = true,
  enableZoom = true,
  enablePan = true,
  autoRotate = false
}: MobileOptimizedCanvasProps) {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    
    // Check on mount
    checkMobile()
    
    // Also check on resize (for orientation changes)
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])
  
  return (
    <Canvas
      className={className}
      camera={{
        position: camera.position,
        fov: isMobile ? 75 : (camera.fov || 60), // Wider FOV on mobile
        near: 0.1,
        far: 1000
      }}
      dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower pixel ratio on mobile
      performance={{ min: 0.5 }} // Allow performance scaling
      gl={{
        antialias: !isMobile, // Disable antialiasing on mobile
        alpha: true,
        powerPreference: 'high-performance'
      }}
    >
      {children}
      
      {/* Add mobile optimizations */}
      <MobileThreeSupport />
      
      {/* Add appropriate controls based on device and settings */}
      {enableOrbitControls && (
        isMobile ? (
          <MobileOrbitControls
            enableDamping={enableDamping}
            enableZoom={enableZoom}
            enablePan={enablePan}
            autoRotate={autoRotate}
            dampingFactor={0.1}
            minDistance={5}
            maxDistance={50}
          />
        ) : (
          <OrbitControls
            enableDamping={enableDamping}
            enableZoom={enableZoom}
            enablePan={enablePan}
            autoRotate={autoRotate}
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={100}
          />
        )
      )}
      
      {/* Add touch controls for mobile if enabled */}
      {isMobile && enableTouchControls && !enableOrbitControls && (
        <MobileTouchControls />
      )}
    </Canvas>
  )
} 