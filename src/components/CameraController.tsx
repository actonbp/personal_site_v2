"use client"

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'

// Define an interface for the controls with the update method
interface OrbitControlsType {
  update: () => void;
  target: THREE.Vector3;
  enabled: boolean;
  [key: string]: any;
}

interface CameraControllerProps {
  isInteracting: boolean;
}

export default function CameraController({ isInteracting }: CameraControllerProps) {
  const { camera, controls, scene } = useThree()
  const initialRotationRef = useRef<THREE.Euler | null>(null)
  const initialPositionRef = useRef<THREE.Vector3 | null>(null)
  const targetRotationRef = useRef<THREE.Euler | null>(null)
  const targetPositionRef = useRef<THREE.Vector3 | null>(null)
  const animatingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const cameraPathRef = useRef<THREE.CatmullRomCurve3 | null>(null)
  const pathProgressRef = useRef(0)
  const shouldFollowPathRef = useRef(false)
  
  // Set up orbital camera paths for cinematic movement
  useEffect(() => {
    // Create a circular path around the origin
    const points = []
    const radius = 20
    const height = 6
    const segments = 64
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius * (0.8 + Math.sin(angle * 3) * 0.2)
      const y = Math.sin(angle * 2) * height
      const z = Math.sin(angle) * radius * (0.8 + Math.cos(angle * 2) * 0.2)
      points.push(new THREE.Vector3(x, y, z))
    }
    
    // Create a closed spline from the points
    cameraPathRef.current = new THREE.CatmullRomCurve3(points)
    cameraPathRef.current.closed = true
    
    // Start automated camera movement after 30 seconds of inactivity
    const startAutomatedMovement = () => {
      if (!isInteracting && !animatingRef.current) {
        shouldFollowPathRef.current = true
        pathProgressRef.current = 0
      }
    }
    
    // Set up the automated movement timer
    const automatedMovementTimer = setTimeout(startAutomatedMovement, 30000)
    
    return () => {
      clearTimeout(automatedMovementTimer)
    }
  }, [])

  // Store initial camera rotation when interaction stops
  useEffect(() => {
    if (isInteracting) {
      // User is interacting, clear any pending recentering
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      // Stop any automated camera movement
      shouldFollowPathRef.current = false
      animatingRef.current = false
      
      // Kill any active animations
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      
      // Re-enable orbit controls if they exist
      if (controls) {
        const orbitControls = controls as unknown as OrbitControlsType
        orbitControls.enabled = true
      }
      
    } else {
      // User stopped interacting, store current rotation and set up recentering
      initialRotationRef.current = camera.rotation.clone()
      initialPositionRef.current = camera.position.clone()
      
      // Calculate target rotation (looking at center with slight offset for more interesting view)
      const targetRotation = new THREE.Euler()
      const targetPosition = new THREE.Vector3(0, 1, 15) // Slightly elevated position
      
      // Store target values
      targetRotationRef.current = targetRotation
      targetPositionRef.current = targetPosition
      
      // Start animation after a delay
      timeoutRef.current = setTimeout(() => {
        animateToCenter()
      }, 3000)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isInteracting, camera, controls])
  
  // Animated transition to center with GSAP
  const animateToCenter = () => {
    if (!targetPositionRef.current) return
    
    // Kill any existing animation
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
    
    // Flag that we're animating
    animatingRef.current = true
    
    // Temporarily disable orbit controls during animation
    if (controls) {
      const orbitControls = controls as unknown as OrbitControlsType
      orbitControls.enabled = false
    }
    
    // Create new timeline with enhanced easing
    timelineRef.current = gsap.timeline({
      onComplete: () => {
        // Re-enable orbit controls after animation
        if (controls) {
          const orbitControls = controls as unknown as OrbitControlsType
          orbitControls.enabled = true
        }
        
        // Switch to path follow mode after a delay
        setTimeout(() => {
          if (!isInteracting) {
            shouldFollowPathRef.current = true
            pathProgressRef.current = 0
          }
        }, 15000) // Wait 15 seconds before starting path movement
      }
    })
    
    // Add subtle camera shake at start for more dynamic feel
    const shakeStrength = 0.05
    const initialPos = camera.position.clone()
    
    // Add initial subtle shake
    timelineRef.current.to(camera.position, {
      x: initialPos.x + (Math.random() - 0.5) * shakeStrength,
      y: initialPos.y + (Math.random() - 0.5) * shakeStrength,
      z: initialPos.z + (Math.random() - 0.5) * shakeStrength,
      duration: 0.1
    })
    
    // Main move to target position with dynamic easing
    timelineRef.current.to(camera.position, {
      x: targetPositionRef.current.x,
      y: targetPositionRef.current.y,
      z: targetPositionRef.current.z,
      duration: 2.5,
      ease: "power3.inOut"
    })
    
    // Make camera look at a slightly offset position for more interest
    const lookAtTarget = new THREE.Vector3(0, 0, 0)
    
    // Store the initial look-at vector
    const initialLookAt = new THREE.Vector3(0, 0, -1)
    initialLookAt.applyQuaternion(camera.quaternion)
    initialLookAt.add(camera.position)
    
    // Animate the look-at transition using a dummy object
    const lookAtDummy = { t: 0 }
    timelineRef.current.to(lookAtDummy, {
      t: 1,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => {
        // Interpolate between initial look-at and target
        const currentLookAt = new THREE.Vector3().lerpVectors(
          initialLookAt,
          lookAtTarget,
          lookAtDummy.t
        )
        camera.lookAt(currentLookAt)
        
        // Update orbit controls if they exist
        if (controls) {
          const orbitControls = controls as unknown as OrbitControlsType
          orbitControls.target.copy(lookAtTarget)
          orbitControls.update()
        }
      }
    }, 0) // Run in parallel with position animation
  }
  
  // Complex easing functions for more cinematic movement
  const elasticOut = (t: number): number => {
    return Math.sin(-13.0 * (t + 1.0) * Math.PI / 2) * Math.pow(2.0, -10.0 * t) + 1.0
  }
  
  const circInOut = (t: number): number => {
    if (t < 0.5) {
      return 0.5 * (1 - Math.sqrt(1 - 4 * t * t))
    } else {
      return 0.5 * (Math.sqrt(-((2 * t) - 3) * ((2 * t) - 1)) + 1)
    }
  }
  
  // Enhanced camera animation
  useFrame((state, delta) => {
    // If we're supposed to follow the orbital path
    if (shouldFollowPathRef.current && cameraPathRef.current) {
      // Increment progress along the path
      pathProgressRef.current += delta * 0.05 // Adjust for speed
      if (pathProgressRef.current > 1) pathProgressRef.current = 0
      
      // Get position along the path
      const position = cameraPathRef.current.getPoint(pathProgressRef.current)
      
      // Smoothly interpolate camera position
      camera.position.lerp(position, delta * 2)
      
      // Look at center with slight oscillation
      const time = state.clock.elapsedTime
      const lookAtTarget = new THREE.Vector3(
        Math.sin(time * 0.2) * 3,
        Math.cos(time * 0.1) * 2,
        Math.sin(time * 0.15) * 3
      )
      camera.lookAt(lookAtTarget)
      
      // Update orbit controls if they exist
      if (controls) {
        const orbitControls = controls as unknown as OrbitControlsType
        orbitControls.target.copy(new THREE.Vector3(0, 0, 0))
        orbitControls.update()
      }
    }
    
    // No need for manual animation when using GSAP
    // GSAP handles all the animation updates internally
  })
  
  return null
} 