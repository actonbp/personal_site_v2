"use client"

import { useState, useRef } from "react"
import { Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface TourButton3DProps {
  onStartTour: () => void
}

export default function TourButton3D({ onStartTour }: TourButton3DProps) {
  const [isHovered, setIsHovered] = useState(false)
  const textRef = useRef<THREE.Mesh>(null!)
  
  // Position the button in a visible area of the scene
  const position: [number, number, number] = [0, -8, 0]
  
  // Animate the button to make it more noticeable
  useFrame((state, delta) => {
    if (textRef.current) {
      // Gentle floating animation
      textRef.current.position.y += Math.sin(state.clock.elapsedTime) * delta * 0.4
      
      // Subtle rotation
      textRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })
  
  // Use the same styling as the topic words
  const scale = isHovered ? 2.2 : 1.8
  const color = isHovered ? "#ffff00" : "#a78bfa"
  
  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={1.5}
      maxWidth={200}
      lineHeight={1}
      letterSpacing={0.05}
      textAlign="center"
      font="/fonts/Inter-Bold.ttf"
      anchorX="center"
      anchorY="middle"
      color={color}
      scale={[scale, scale, scale]}
      onClick={(event) => {
        event.stopPropagation()
        onStartTour()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = "pointer"
        setIsHovered(true)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        document.body.style.cursor = "default"
        setIsHovered(false)
      }}
    >
      TAKE GUIDED TOUR
    </Text>
  )
} 