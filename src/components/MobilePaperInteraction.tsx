"use client"

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

interface MobilePaperInteractionProps {
  isDetailActive: boolean
}

export default function MobilePaperInteraction({ isDetailActive }: MobilePaperInteractionProps) {
  const { camera, gl } = useThree()
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // When paper detail is active, we want to optimize for reading
      if (isDetailActive) {
        // Disable orbit controls temporarily for better reading experience
        const orbitControls = gl.domElement.parentElement?.querySelector('.orbit-controls')
        if (orbitControls) {
          orbitControls.setAttribute('data-enabled', 'false')
        }
        
        // Enable pinch-to-zoom for reading papers
        const handleTouchMove = (e: TouchEvent) => {
          if (e.touches.length === 2) {
            // This is a pinch gesture
            e.preventDefault()
            
            // Calculate distance between touch points
            const dx = e.touches[0].clientX - e.touches[1].clientX
            const dy = e.touches[0].clientY - e.touches[1].clientY
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            // Use this distance to adjust camera zoom if needed
            // This is just a placeholder - actual implementation would depend on your camera setup
            if (camera.zoom) {
              // Adjust zoom based on pinch
              // Implementation details would depend on your specific needs
            }
          }
        }
        
        // Add touch event listeners
        gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: false })
        
        return () => {
          // Clean up
          gl.domElement.removeEventListener('touchmove', handleTouchMove)
          
          // Re-enable orbit controls
          if (orbitControls) {
            orbitControls.setAttribute('data-enabled', 'true')
          }
        }
      }
    }
  }, [isDetailActive, camera, gl])
  
  return null
} 