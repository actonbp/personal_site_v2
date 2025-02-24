"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Text, Float } from "@react-three/drei"
import * as THREE from "three"

type PaperProps = {
  title: string
  position: [number, number, number]
  isVisible: boolean
  topicPosition: [number, number, number]
}

export default function Paper({ title, position, isVisible, topicPosition }: PaperProps) {
  const paperRef = useRef<THREE.Group>(null!)
  const lineRef = useRef<THREE.Line>(null!)

  // Create a line geometry to connect paper to topic
  const points = [
    new THREE.Vector3(...position),
    new THREE.Vector3(...topicPosition)
  ]
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: "#00ff00",
    transparent: true,
    opacity: isVisible ? 0.5 : 0
  })

  useFrame((state) => {
    if (paperRef.current && isVisible) {
      // Add subtle floating movement
      paperRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.001
    }
  })

  return (
    <group>
      <primitive object={new THREE.Line(lineGeometry, lineMaterial)} ref={lineRef} />
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <group 
          ref={paperRef}
          position={position}
          scale={isVisible ? 1 : 0}
          visible={isVisible}
        >
          {/* Paper background */}
          <mesh>
            <planeGeometry args={[4, 3]} />
            <meshBasicMaterial color="#111111" transparent opacity={0.8} />
          </mesh>
          {/* Paper title */}
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.3}
            maxWidth={3}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
            material-transparent={true}
            material-opacity={isVisible ? 1 : 0}
          >
            {title}
          </Text>
        </group>
      </Float>
    </group>
  )
} 