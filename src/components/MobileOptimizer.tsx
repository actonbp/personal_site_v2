"use client"

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * MobileOptimizer component enhances the experience on mobile devices
 * by adjusting camera and controls settings for touch interactions
 */
export default function MobileOptimizer() {
  const { camera, gl } = useThree()
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Adjust renderer pixel ratio for better performance on mobile
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      
      // Adjust camera settings for mobile view
      if (camera) {
        // Increase the default field of view slightly for mobile
        camera.fov = 75
        camera.updateProjectionMatrix()
      }
      
      // Add touch-specific event listeners if needed
      const handleTouchStart = () => {
        // This ensures audio context can start on iOS (if you have audio)
        // Also useful for other interactions that require user gesture
        document.body.style.overflow = 'hidden' // Prevent bounce/scroll on iOS
      }
      
      document.addEventListener('touchstart', handleTouchStart, { passive: false })
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
      }
    }
  }, [camera, gl])
  
  // This component doesn't render anything visible
  return null
} 