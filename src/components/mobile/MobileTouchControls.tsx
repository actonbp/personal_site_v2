"use client"

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * MobileTouchControls component enhances touch interactions for Three.js
 * This component should be added inside your Canvas component
 */
export default function MobileTouchControls() {
  const { gl, camera, scene } = useThree()
  const touchStartRef = useRef({ x: 0, y: 0 })
  const touchPrevRef = useRef({ x: 0, y: 0 })
  const pinchStartRef = useRef(0)
  const isInteractingRef = useRef(false)
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      console.log('Applying touch controls for mobile')
      const canvas = gl.domElement
      
      // Handle touch start
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault()
        
        if (e.touches.length === 1) {
          // Single touch - rotation
          touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          }
          touchPrevRef.current = { ...touchStartRef.current }
          isInteractingRef.current = true
        } 
        else if (e.touches.length === 2) {
          // Pinch gesture - zoom
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          pinchStartRef.current = Math.sqrt(dx * dx + dy * dy)
        }
      }
      
      // Handle touch move
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        
        if (e.touches.length === 1 && isInteractingRef.current) {
          // Single touch - rotation
          const touchCurrent = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          }
          
          // Calculate deltas
          const deltaX = (touchCurrent.x - touchPrevRef.current.x) * 0.01
          const deltaY = (touchCurrent.y - touchPrevRef.current.y) * 0.01
          
          // Update camera rotation
          if (camera instanceof THREE.PerspectiveCamera) {
            // Orbit around target
            const target = new THREE.Vector3(0, 0, 0)
            const offset = new THREE.Vector3().subVectors(camera.position, target)
            
            // Rotate horizontally
            const theta = Math.atan2(offset.x, offset.z)
            const phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y)
            
            // Apply rotation
            const newTheta = theta - deltaX
            const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY))
            
            // Calculate new position
            const radius = offset.length()
            offset.x = radius * Math.sin(newPhi) * Math.sin(newTheta)
            offset.y = radius * Math.cos(newPhi)
            offset.z = radius * Math.sin(newPhi) * Math.cos(newTheta)
            
            camera.position.copy(target).add(offset)
            camera.lookAt(target)
          }
          
          // Update previous position
          touchPrevRef.current = { ...touchCurrent }
        } 
        else if (e.touches.length === 2) {
          // Pinch gesture - zoom
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const pinchCurrent = Math.sqrt(dx * dx + dy * dy)
          
          // Calculate zoom factor
          const pinchDelta = (pinchCurrent - pinchStartRef.current) * 0.05
          
          // Apply zoom
          if (camera instanceof THREE.PerspectiveCamera) {
            const target = new THREE.Vector3(0, 0, 0)
            const offset = new THREE.Vector3().subVectors(camera.position, target)
            const newRadius = Math.max(5, Math.min(50, offset.length() - pinchDelta))
            
            offset.normalize().multiplyScalar(newRadius)
            camera.position.copy(target).add(offset)
          }
          
          // Update pinch start
          pinchStartRef.current = pinchCurrent
        }
      }
      
      // Handle touch end
      const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length === 0) {
          isInteractingRef.current = false
        }
      }
      
      // Add event listeners
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
      canvas.addEventListener('touchend', handleTouchEnd)
      canvas.addEventListener('touchcancel', handleTouchEnd)
      
      return () => {
        // Clean up
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchmove', handleTouchMove)
        canvas.removeEventListener('touchend', handleTouchEnd)
        canvas.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [gl, camera, scene])
  
  return null
} 