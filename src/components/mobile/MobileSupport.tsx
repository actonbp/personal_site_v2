"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { isMobileDevice } from '@/lib/utils'

// Dynamically import components that require client-side rendering
const MobileViewport = dynamic(() => import('./MobileViewport'), { ssr: false })
const MobileOptimizer = dynamic(() => import('./MobileOptimizer'), { ssr: false })
const MobilePerformance = dynamic(() => import('./MobilePerformance'), { ssr: false })

export default function MobileSupport() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // Detect if we're on a mobile device using shared utility
    const checkMobile = () => {
      setIsMobile(isMobileDevice())
    }
    
    // Check on mount
    checkMobile()
    
    // Also check on resize (for orientation changes)
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])
  
  // Only render mobile optimizations if on a mobile device
  if (!isMobile) return null
  
  return (
    <>
      <MobileViewport />
      <MobileOptimizer />
      <MobilePerformance />
    </>
  )
} 