"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import mobile components
const MobileThreeSupport = dynamic(() => import('./MobileThreeSupport'), { ssr: false })
const MobileViewport = dynamic(() => import('./MobileViewport'), { ssr: false })

/**
 * MobileIntegration component
 * Add this component to your app to enable mobile optimizations
 * It doesn't render anything visible, just adds the necessary optimizations
 */
export default function MobileIntegration() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
      
      if (isMobileDevice) {
        console.log('Mobile device detected, applying optimizations')
        
        // Add mobile class to body
        document.body.classList.add('mobile-device')
        
        // Load mobile initialization script if not already loaded
        if (!document.querySelector('script[src="/mobile-init.js"]')) {
          const script = document.createElement('script')
          script.src = '/mobile-init.js'
          document.head.appendChild(script)
        }
      }
    }
    
    // Check on mount
    checkMobile()
    
    // Also check on resize (for orientation changes)
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      document.body.classList.remove('mobile-device')
    }
  }, [])
  
  // Only render mobile optimizations if on a mobile device
  if (!isMobile) return null
  
  return (
    <>
      <MobileViewport />
      <style jsx global>{`
        body.mobile-device {
          touch-action: none;
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          -webkit-overflow-scrolling: touch;
        }
        
        body.mobile-device * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          user-select: none;
        }
        
        body.mobile-device canvas {
          touch-action: none;
        }
      `}</style>
    </>
  )
} 