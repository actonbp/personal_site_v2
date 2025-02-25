"use client"

import { useRef, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// Define an interface for OrbitControls
interface OrbitControlsProps {
  rotateSpeed?: number;
  zoomSpeed?: number;
  dampingFactor?: number;
  update?: () => void;
  [key: string]: any;
}

interface MobileOrbitControlsProps {
  enableDamping?: boolean
  dampingFactor?: number
  enableZoom?: boolean
  enablePan?: boolean
  autoRotate?: boolean
  autoRotateSpeed?: number
  minDistance?: number
  maxDistance?: number
  minPolarAngle?: number
  maxPolarAngle?: number
  target?: [number, number, number]
  onStart?: () => void
  onEnd?: () => void
  onChange?: () => void
}

export default function MobileOrbitControls({
  enableDamping = true,
  dampingFactor = 0.1,
  enableZoom = true,
  enablePan = true,
  autoRotate = false,
  autoRotateSpeed = 1.0,
  minDistance = 1,
  maxDistance = 100,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI,
  target = [0, 0, 0],
  onStart,
  onEnd,
  onChange
}: MobileOrbitControlsProps) {
  // Use the correct type for the ref
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl } = useThree()
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile && controlsRef.current) {
      // Adjust controls for mobile
      const controls = controlsRef.current
      
      // Make touch rotation more sensitive
      if (controls.rotateSpeed !== undefined) {
        controls.rotateSpeed = 1.2
      }
      
      // Make pinch zoom more responsive
      if (controls.zoomSpeed !== undefined) {
        controls.zoomSpeed = 1.5
      }
      
      // Reduce inertia slightly for more direct control
      if (controls.dampingFactor !== undefined) {
        controls.dampingFactor = 0.15
      }
    }
  }, [])
  
  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      enableZoom={enableZoom}
      enablePan={enablePan}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      target={new THREE.Vector3(...target)}
      onStart={onStart}
      onEnd={onEnd}
      onChange={onChange}
      // Mobile-optimized settings
      enableRotate={true}
      rotateSpeed={1.2}
      zoomSpeed={1.5}
    />
  )
} 