"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import mobile components
const MobileViewport = dynamic(() => import('./mobile/MobileViewport'), { ssr: false })
const MobileOrbitControls = dynamic(() => import('./mobile/MobileOrbitControls'), { ssr: false })
const MobileSupport = dynamic(() => import('./mobile/MobileSupport'), { ssr: false })
const MobileTourButton = dynamic(() => import('./mobile/MobileTourButton'), { ssr: false })
const MobileGuidedTour = dynamic(() => import('./mobile/MobileGuidedTour'), { ssr: false })

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false)
  
  useEffect(() => {
    // Add a class to the body for mobile-specific CSS
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      document.body.classList.add('mobile-device')
      
      // Create and add mobile-specific meta tags
      const viewportMeta = document.createElement('meta')
      viewportMeta.setAttribute('name', 'viewport')
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      document.head.appendChild(viewportMeta)
      
      // Add mobile-specific styles
      const mobileStyles = document.createElement('style')
      mobileStyles.textContent = `
        body.mobile-device {
          touch-action: none;
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Prevent text selection on mobile */
        body.mobile-device * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          user-select: none;
        }
        
        /* Optimize canvas for mobile */
        body.mobile-device canvas {
          touch-action: none;
        }
      `
      document.head.appendChild(mobileStyles)
      
      return () => {
        document.body.classList.remove('mobile-device')
        document.head.removeChild(viewportMeta)
        document.head.removeChild(mobileStyles)
      }
    }
  }, [])
  
  // Handle tour activation
  const handleStartTour = () => {
    setIsTourActive(true)
  }
  
  const handleTourComplete = () => {
    setIsTourActive(false)
  }
  
  const handleTourStop = () => {
    setIsTourActive(false)
  }
  
  return (
    <>
      {children}
      <MobileViewport />
      <MobileSupport />
      
      {/* Tour components */}
      {!isTourActive && <MobileTourButton onStartTour={handleStartTour} />}
      <MobileGuidedTour 
        isActive={isTourActive} 
        onComplete={handleTourComplete} 
        onStop={handleTourStop} 
      />
    </>
  )
} 