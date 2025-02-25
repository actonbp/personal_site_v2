"use client"

import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Line } from '@react-three/drei'
import * as THREE from 'three'

interface PaperDetailProps {
  title: string
  abstract: string
  isActive: boolean
  paperPosition: [number, number, number]
  onClose: () => void
}

// Smooth easing functions
const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3)
const easeInOutQuint = (x: number): number => x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2

export default function PaperDetail({ title, abstract, isActive, paperPosition, onClose }: PaperDetailProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const textRef = useRef<THREE.Mesh>(null!)
  const { size } = useThree()
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if we're on a mobile device
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])
  
  // Animation state
  const animState = useRef({
    progress: 0,
    elapsedTime: 0,
    animationDuration: 2.0, // seconds
    cameraPath: [] as THREE.Vector3[],
    originalCameraPosition: new THREE.Vector3(),
    targetCameraPosition: new THREE.Vector3()
  })

  // Create backdrop material
  const backdropMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  }), [])

  // Create backdrop geometry
  const backdropGeometry = useMemo(() => new THREE.PlaneGeometry(100, 100), [])

  // Create paper material
  const paperMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1
  }), [])

  // Create paper geometry (standard paper size ratio)
  const paperGeometry = useMemo(() => new THREE.PlaneGeometry(8.5, 11), [])

  // Generate camera path when activated
  useEffect(() => {
    if (isActive) {
      // Store original camera position
      animState.current.originalCameraPosition = new THREE.Vector3(
        paperPosition[0], 
        paperPosition[1], 
        paperPosition[2] + 25
      )
      
      // Set target position
      animState.current.targetCameraPosition = new THREE.Vector3(
        paperPosition[0], 
        paperPosition[1], 
        paperPosition[2] + 10
      )
      
      // Generate a smooth path with control points
      const controlPoints = []
      const startPos = animState.current.originalCameraPosition.clone()
      const endPos = animState.current.targetCameraPosition.clone()
      
      // Create a smooth S-curve path
      for (let i = 0; i < 5; i++) {
        const t = i / 4
        const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t)
        
        // Add gentle curve to path
        if (i > 0 && i < 4) {
          const curveAmount = 3 * Math.sin(t * Math.PI)
          pos.x += (Math.sin(t * Math.PI * 2)) * curveAmount
          pos.y += (Math.cos(t * Math.PI)) * curveAmount * 0.5
        }
        
        controlPoints.push(pos)
      }
      
      // Create a smooth curve from the control points
      const curve = new THREE.CatmullRomCurve3(controlPoints)
      curve.tension = 0.2 // Make curve smoother
      
      // Sample points along the curve
      animState.current.cameraPath = curve.getPoints(30)
      
      // Reset animation state
      animState.current.progress = 0
      animState.current.elapsedTime = 0
    }
  }, [isActive, paperPosition])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (isActive) {
      // Update elapsed time with capped delta to prevent jumps
      const cappedDelta = Math.min(delta, 0.1)
      animState.current.elapsedTime += cappedDelta
      
      // Calculate progress based on animation duration with easing
      const rawProgress = Math.min(animState.current.elapsedTime / animState.current.animationDuration, 1)
      animState.current.progress = easeInOutQuint(rawProgress)
      
      // Camera movement along the path - adjust for mobile
      if (animState.current.cameraPath.length > 0) {
        const pathIndex = Math.min(
          Math.floor(animState.current.progress * (animState.current.cameraPath.length - 1)),
          animState.current.cameraPath.length - 1
        )
        
        // Get position from path with interpolation between points for smoother movement
        const currentPoint = animState.current.cameraPath[pathIndex]
        const nextPoint = animState.current.cameraPath[Math.min(pathIndex + 1, animState.current.cameraPath.length - 1)]
        
        // Interpolate between path points
        const subProgress = animState.current.progress * (animState.current.cameraPath.length - 1) - pathIndex
        const targetPos = new THREE.Vector3().lerpVectors(currentPoint, nextPoint, subProgress)
        
        // Apply position with smooth lerp - faster on mobile for more responsive feel
        const lerpSpeed = isMobile ? 0.3 : 0.2
        state.camera.position.lerp(targetPos, lerpSpeed)
      }
      
      // Always look at the paper
      state.camera.lookAt(new THREE.Vector3(paperPosition[0], paperPosition[1], paperPosition[2]))
      
      // Scale up animation with no wobble - faster on mobile
      const scaleSpeed = isMobile ? 0.15 : 0.1
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), scaleSpeed)
      
      // Update backdrop opacity
      backdropMaterial.opacity = animState.current.progress * 0.99
    } else {
      // Reverse animation - faster on mobile
      const fadeSpeed = isMobile ? 0.97 : 0.95
      animState.current.progress *= fadeSpeed
      backdropMaterial.opacity *= fadeSpeed
      
      // Scale down - faster on mobile
      const scaleSpeed = isMobile ? 0.15 : 0.1
      groupRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), scaleSpeed)
      
      // Reset camera position smoothly - faster on mobile
      if (animState.current.originalCameraPosition.length() > 0) {
        const resetSpeed = isMobile ? 0.08 : 0.05
        state.camera.position.lerp(animState.current.originalCameraPosition, resetSpeed)
      }
    }
  })

  // Adjust text size for mobile
  const getFontSize = (baseSize: number) => {
    return isMobile ? baseSize * 1.2 : baseSize
  }

  // Don't render when not active and fully scaled down
  if (!isActive && groupRef.current?.scale.x < 0.01) return null

  return (
    <group
      ref={groupRef}
      position={paperPosition}
      scale={0.001}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      {/* Backdrop to hide background */}
      <mesh position={[0, 0, -1]} material={backdropMaterial} geometry={backdropGeometry} />

      {/* Paper background */}
      <mesh position={[0, 0, 0]} material={paperMaterial} geometry={paperGeometry} />

      {/* Horizontal lines */}
      <Line 
        points={[[-4, 5, 0.01], [4, 5, 0.01]]} 
        color="black" 
        lineWidth={2}
      />
      <Line 
        points={[[-4, 4.5, 0.01], [4, 4.5, 0.01]]} 
        color="black" 
        lineWidth={2}
      />

      {/* Title */}
      <group position={[0, 5.2, 0.01]}>
        <Text
          color="black"
          fontSize={getFontSize(0.45)}
          maxWidth={7}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
      </group>

      {/* Author */}
      <group position={[0, 3.8, 0.01]}>
        <Text
          color="black"
          fontSize={getFontSize(0.35)}
          maxWidth={7}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          Bryan Acton
        </Text>
      </group>

      {/* Affiliation */}
      <group position={[0, 3.3, 0.01]}>
        <Text
          color="black"
          fontSize={getFontSize(0.25)}
          maxWidth={7}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          Google Research
        </Text>
      </group>

      {/* Email */}
      <group position={[0, 2.8, 0.01]}>
        <Text
          color="black"
          fontSize={getFontSize(0.25)}
          maxWidth={7}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          bacton@google.com
        </Text>
      </group>

      {/* Abstract Header */}
      <group position={[0, 1.8, 0.01]}>
        <Text
          color="black"
          fontSize={getFontSize(0.35)}
          maxWidth={7}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          Abstract
        </Text>
      </group>

      {/* Abstract Text */}
      <group position={[0, 0.2, 0.01]} name="textContent">
        <Text
          ref={textRef}
          color="black"
          fontSize={getFontSize(0.25)}
          maxWidth={7}
          textAlign="justify"
          anchorX="center"
          anchorY="middle"
        >
          {abstract}
        </Text>
      </group>

      {/* Close button - larger on mobile */}
      <group 
        position={[3.8, 5.2, 0.01]} 
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <Text
          color="black"
          fontSize={getFontSize(0.25)}
          anchorX="right"
          anchorY="middle"
        >
          {isMobile ? "× Close" : "Close"}
        </Text>
      </group>
    </group>
  )
} 