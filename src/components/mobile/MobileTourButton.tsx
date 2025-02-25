"use client"

import { useState, useEffect } from "react"
import { Html } from "@react-three/drei"

interface MobileTourButtonProps {
  onStartTour: () => void
}

export default function MobileTourButton({ onStartTour }: MobileTourButtonProps) {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // Check if we're on a mobile device
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])
  
  // Only render on mobile devices
  if (!isMobile) return null
  
  return (
    <Html position={[0, -8, 0]} transform center>
      <button
        onClick={onStartTour}
        className="
          px-4 py-3 rounded-full
          bg-indigo-500 active:bg-indigo-600
          text-white font-medium
          flex items-center space-x-2
          shadow-lg
          text-lg
          fixed bottom-6 right-6
          z-50
        "
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
            clipRule="evenodd" 
          />
        </svg>
        <span>Take Tour</span>
      </button>
    </Html>
  )
} 