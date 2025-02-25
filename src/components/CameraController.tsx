"use client"

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Define an interface for the controls with the update method
interface OrbitControlsType {
  update: () => void;
  target: THREE.Vector3;
  [key: string]: any;
}

interface CameraControllerProps {
  isInteracting: boolean;
}

export default function CameraController({ isInteracting }: CameraControllerProps) {
  const { camera, controls } = useThree()
  const initialRotationRef = useRef<THREE.Euler | null>(null)
  const initialPositionRef = useRef<THREE.Vector3 | null>(null)
  const targetRotationRef = useRef<THREE.Euler | null>(null)
  const targetPositionRef = useRef<THREE.Vector3 | null>(null)
  const animatingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Store initial camera rotation when interaction stops
  useEffect(() => {
    if (isInteracting) {
      // User is interacting, clear any pending recentering
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      animatingRef.current = false
    } else {
      // User stopped interacting, store current rotation and set up recentering
      initialRotationRef.current = camera.rotation.clone()
      initialPositionRef.current = camera.position.clone()
      
      // Calculate target rotation (looking at center)
      const targetRotation = new THREE.Euler()
      const targetPosition = new THREE.Vector3(0, 0, 15) // Default centered position
      
      // Store target values
      targetRotationRef.current = targetRotation
      targetPositionRef.current = targetPosition
      
      // Start animation after a delay
      timeoutRef.current = setTimeout(() => {
        animatingRef.current = true
      }, 2000)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isInteracting, camera])
  
  // Easing function for smooth animation
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }
  
  // Animate camera back to center when not interacting
  useFrame(() => {
    if (animatingRef.current && 
        initialRotationRef.current && 
        targetRotationRef.current &&
        initialPositionRef.current &&
        targetPositionRef.current) {
      
      // Interpolate rotation
      const step = 0.02 // Adjust for faster/slower animation
      const easedStep = easeOutCubic(step)
      
      // Interpolate position
      camera.position.lerp(targetPositionRef.current, easedStep)
      
      // Look at center
      camera.lookAt(new THREE.Vector3(0, 0, 0))
      
      // If we have orbit controls, update them
      if (controls) {
        // Use type assertion to tell TypeScript that controls has an update method
        const orbitControls = controls as unknown as OrbitControlsType;
        orbitControls.update();
      }
    }
  })
  
  return null
} 