"use client"

import { useState } from "react"
import { Html } from "@react-three/drei"

interface TourButtonProps {
  onStartTour: () => void
}

export default function TourButton({ onStartTour }: TourButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <Html position={[0, 0, 0]} center>
      <button
        onClick={onStartTour}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          px-4 py-2 rounded-full
          ${isHovered ? 'bg-indigo-600' : 'bg-indigo-500'}
          text-white font-medium
          transition-all duration-300
          flex items-center space-x-2
          shadow-lg hover:shadow-xl
          transform ${isHovered ? 'scale-105' : 'scale-100'}
          fixed top-4 right-4 z-50
        `}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
            clipRule="evenodd" 
          />
        </svg>
        <span>Guided Tour</span>
      </button>
    </Html>
  )
} 