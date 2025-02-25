"use client"

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraControllerProps {
  isInteracting: boolean
}

export default function CameraController({ isInteracting }: CameraControllerProps) {
  const { camera, controls } = useThree()
  const targetRotation = useRef(new THREE.Euler())
  const initialRotation = useRef(new THREE.Euler())
  const initialPosition = useRef(new THREE.Vector3())
  const targetPosition = useRef(new THREE.Vector3(0, 0, 20)) // Default camera position
  const recenteringActive = useRef(false)
  const recenteringProgress = useRef(0)
  
  // Store initial camera state when interaction stops
  useEffect(() => {
    if (isInteracting) {
      recenteringActive.current = false
      recenteringProgress.current = 0
    } else {
      // When interaction stops, store current state and activate recentering
      initialRotation.current.copy(camera.rotation)
      initialPosition.current.copy(camera.position)
      
      // Calculate target rotation (looking at center)
      const lookAtMatrix = new THREE.Matrix4()
      lookAtMatrix.lookAt(
        camera.position,
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 1, 0)
      )
      targetRotation.current.setFromRotationMatrix(lookAtMatrix)
      
      // Keep the same distance from center but adjust position to be more centered
      const distance = camera.position.length()
      targetPosition.current.set(0, 0, distance)
      
      recenteringActive.current = true
      recenteringProgress.current = 0
    }
  }, [isInteracting, camera])
  
  // Smoothly recenter the camera
  useFrame((state, delta) => {
    if (recenteringActive.current && !isInteracting) {
      // Gradually increase progress
      recenteringProgress.current += delta * 0.2 // Slower for more gentle recentering
      
      // Clamp progress to 0-1
      recenteringProgress.current = Math.min(recenteringProgress.current, 1)
      
      // Apply smooth easing
      const t = easeOutCubic(recenteringProgress.current)
      
      // Interpolate between initial and target rotation
      camera.rotation.x = THREE.MathUtils.lerp(
        initialRotation.current.x,
        targetRotation.current.x,
        t
      )
      
      camera.rotation.y = THREE.MathUtils.lerp(
        initialRotation.current.y,
        targetRotation.current.y,
        t
      )
      
      camera.rotation.z = THREE.MathUtils.lerp(
        initialRotation.current.z,
        targetRotation.current.z,
        t
      )
      
      // Interpolate position (optional, for more dramatic recentering)
      camera.position.x = THREE.MathUtils.lerp(
        initialPosition.current.x,
        targetPosition.current.x,
        t * 0.5 // Slower position adjustment
      )
      
      camera.position.y = THREE.MathUtils.lerp(
        initialPosition.current.y,
        targetPosition.current.y,
        t * 0.5 // Slower position adjustment
      )
      
      // Stop recentering when complete
      if (recenteringProgress.current >= 1) {
        recenteringActive.current = false
      }
      
      // Update controls target if available
      if (controls && typeof controls.update === 'function') {
        controls.update()
      }
    }
  })
  
  return null
}

// Easing function for smooth animation
const easeOutCubic = (x: number): number => {
  return 1 - Math.pow(1 - x, 3)
} 