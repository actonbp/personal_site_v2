"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import mobile components from centralized exports
const { 
  MobileViewport,
  MobileOrbitControls,
  MobileSupport,
  MobileTourButton
} = {
  MobileViewport: dynamic(() => import('./mobile').then(mod => ({ default: mod.MobileViewport })), { ssr: false }),
  MobileOrbitControls: dynamic(() => import('./mobile').then(mod => ({ default: mod.MobileOrbitControls })), { ssr: false }),
  MobileSupport: dynamic(() => import('./mobile').then(mod => ({ default: mod.MobileSupport })), { ssr: false }),
  MobileTourButton: dynamic(() => import('./mobile').then(mod => ({ default: mod.MobileTourButton })), { ssr: false })
}

import { isMobileDevice as checkMobileDevice } from '@/lib/utils'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  
  useEffect(() => {
    // Add a class to the body for mobile-specific CSS
    const isMobile = checkMobileDevice()
    
    if (isMobile) {
      setIsMobileDevice(true)
      document.body.classList.add('mobile-device')
      
      // Create and add mobile-specific meta tags
      const viewportMeta = document.createElement('meta')
      viewportMeta.setAttribute('name', 'viewport')
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      document.head.appendChild(viewportMeta)
      
      // Add mobile-specific styles
      const mobileStyles = document.createElement('style')
      mobileStyles.textContent = `
        body {
          touch-action: none;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: auto;
        }
        
        canvas {
          touch-action: none;
        }
      `
      document.head.appendChild(mobileStyles)
      
      // Prevent default touch behaviors
      document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault()
        }
      }, { passive: false })
      
      // Clean up on unmount
      return () => {
        document.body.classList.remove('mobile-device')
        document.head.removeChild(viewportMeta)
        document.head.removeChild(mobileStyles)
      }
    }
  }, [])
  
  return (
    <>
      {children}
      
      {/* Mobile-specific UI components */}
      {isMobileDevice && (
        <>
          <MobileViewport />
          <MobileOrbitControls />
          <MobileSupport />
          <MobileTourButton 
            onStartTour={() => {
              // Tour functionality removed - to be implemented in future
              console.log('Tour functionality coming soon');
            }} 
          />
        </>
      )}
    </>
  )
} 