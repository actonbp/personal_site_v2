"use client"

import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface MobilePaperProps {
  paperRef: React.RefObject<THREE.Group>
  isDetailActive: boolean
}

export default function MobilePaper({ paperRef, isDetailActive }: MobilePaperProps) {
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 })
  const [isTouching, setIsTouching] = useState(false)
  const { camera, gl } = useThree()
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile && paperRef.current) {
      // When paper detail is active, enhance touch interactions
      if (isDetailActive) {
        const canvas = gl.domElement
        
        // Handle touch start
        const handleTouchStart = (e: TouchEvent) => {
          if (e.touches.length === 1) {
            setTouchStartPos({
              x: e.touches[0].clientX,
              y: e.touches[0].clientY
            })
            setIsTouching(true)
          }
        }
        
        // Handle touch move for paper interactions
        const handleTouchMove = (e: TouchEvent) => {
          if (!isTouching || e.touches.length !== 1) return
          
          // Calculate touch delta
          const deltaX = e.touches[0].clientX - touchStartPos.x
          const deltaY = e.touches[0].clientY - touchStartPos.y
          
          // If this is a significant drag, use it to scroll the paper content
          if (Math.abs(deltaY) > 10) {
            // Adjust paper position for scrolling effect
            // This is a placeholder - actual implementation depends on your paper structure
            if (paperRef.current) {
              // Example: Move the text group within the paper
              const textGroup = paperRef.current.children.find(
                child => child.name === 'textContent'
              )
              
              if (textGroup) {
                // Scroll text content
                const newY = textGroup.position.y + deltaY * 0.01
                // Limit scrolling range
                const maxScroll = 2
                const minScroll = -2
                textGroup.position.y = Math.max(minScroll, Math.min(maxScroll, newY))
              }
            }
            
            // Update touch start position for continuous movement
            setTouchStartPos({
              x: e.touches[0].clientX,
              y: e.touches[0].clientY
            })
          }
        }
        
        // Handle touch end
        const handleTouchEnd = () => {
          setIsTouching(false)
        }
        
        // Add event listeners
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd)
        
        return () => {
          // Clean up
          canvas.removeEventListener('touchstart', handleTouchStart)
          canvas.removeEventListener('touchmove', handleTouchMove)
          canvas.removeEventListener('touchend', handleTouchEnd)
        }
      }
    }
  }, [paperRef, isDetailActive, isTouching, touchStartPos, gl, camera])
  
  return null
} 