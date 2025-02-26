"use client"

import { useState, useRef } from "react"
import { Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface ReturnButton3DProps {
  onReturn: () => void
  topicName: string
}

export default function ReturnButton3D({ onReturn, topicName }: ReturnButton3DProps) {
  const [isHovered, setIsHovered] = useState(false)
  const textRef = useRef<THREE.Mesh>(null!)
  
  // Position the button above the focused topic
  const position: [number, number, number] = [0, 8, 0]
  
  // Animate the button to make it more noticeable
  useFrame((state, delta) => {
    if (textRef.current) {
      // Gentle floating animation
      textRef.current.position.y += Math.sin(state.clock.elapsedTime + 1) * delta * 0.3
    }
  })
  
  // Use the same styling as the topic words
  const scale = isHovered ? 1.8 : 1.5
  const color = isHovered ? "#ffff00" : "#ffffff"
  
  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={1.2}
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
        onReturn()
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
      ← RETURN FROM {topicName.toUpperCase()}
    </Text>
  )
} 