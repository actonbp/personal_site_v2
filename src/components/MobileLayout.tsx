"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import mobile components
const MobileViewport = dynamic(() => import('./mobile/MobileViewport'), { ssr: false })
const MobileOrbitControls = dynamic(() => import('./mobile/MobileOrbitControls'), { ssr: false })
const MobileSupport = dynamic(() => import('./mobile/MobileSupport'), { ssr: false })
const MobileTourButton = dynamic(() => import('./mobile/MobileTourButton'), { ssr: false })

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  
  useEffect(() => {
    // Add a class to the body for mobile-specific CSS
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
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