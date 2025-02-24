"use client"

import { useRef, useMemo } from "react"
import { Text, Float } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@&%*!?><[]{}".split("")
const numCharacters = 200

type MatrixRainProps = {
  focusedTopic: string | null
  topicPositions: { [key: string]: [number, number, number] }
}

export default function MatrixRain({ focusedTopic, topicPositions }: MatrixRainProps) {
  const group = useRef<THREE.Group>(null!)
  const textRefs = useRef<THREE.Mesh[]>([])
  const linesRef = useRef<THREE.LineSegments>(null!)

  const initialPositions = useMemo(() => {
    return Array.from({ length: numCharacters }, () => ({
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 50 + 25,
      z: (Math.random() - 0.5) * 50,
      speed: Math.random() * 5 + 2,
      char: characters[Math.floor(Math.random() * characters.length)],
      targetX: 0,
      targetY: 0,
      targetZ: 0
    }))
  }, [])

  // Create network lines
  const lineGeometry = useMemo(() => {
    const points: number[] = []
    const colors: number[] = []
    
    // Create lines between characters when focused
    for (let i = 0; i < numCharacters; i++) {
      for (let j = i + 1; j < numCharacters; j++) {
        if (Math.random() > 0.95) { // Only create lines 5% of the time
          points.push(
            initialPositions[i].x, initialPositions[i].y, initialPositions[i].z,
            initialPositions[j].x, initialPositions[j].y, initialPositions[j].z
          )
          colors.push(0, 1, 0, 0, 1, 0) // Green color
        }
      }
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geometry
  }, [initialPositions])

  useFrame((state, delta) => {
    textRefs.current.forEach((mesh, i) => {
      if (mesh) {
        if (focusedTopic) {
          // When focused, move characters towards a network formation around the topic
          const topicPos = topicPositions[focusedTopic]
          const angle = (i / numCharacters) * Math.PI * 2
          const radius = 15
          
          initialPositions[i].targetX = topicPos[0] + Math.cos(angle) * radius
          initialPositions[i].targetY = topicPos[1] + Math.sin(angle) * radius
          initialPositions[i].targetZ = topicPos[2]

          mesh.position.x += (initialPositions[i].targetX - mesh.position.x) * 0.02
          mesh.position.y += (initialPositions[i].targetY - mesh.position.y) * 0.02
          mesh.position.z += (initialPositions[i].targetZ - mesh.position.z) * 0.02
        } else {
          // Normal matrix rain behavior
          mesh.position.y -= initialPositions[i].speed * delta
          if (mesh.position.y < -25) {
            mesh.position.y = 25
            mesh.position.x = (Math.random() - 0.5) * 50
            mesh.position.z = (Math.random() - 0.5) * 50
          }
        }

        // Update opacity based on focus state
        if (mesh.children[0]) {
          const textGeometry = mesh.children[0] as THREE.Mesh
          if (textGeometry.material instanceof THREE.Material) {
            textGeometry.material.opacity = focusedTopic ? 0.3 : Math.random() * 0.5 + 0.2
          }
        }
      }
    })

    // Update line positions
    if (linesRef.current) {
      const positions = linesRef.current.geometry.attributes.position
      positions.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={focusedTopic ? 0.3 : 0} />
      </lineSegments>
      {initialPositions.map((pos, i) => (
        <Float key={i} speed={1} rotationIntensity={0} floatIntensity={0}>
          <Text
            ref={(el) => {
              if (el) textRefs.current[i] = el
            }}
            position={[pos.x, pos.y, pos.z]}
            fontSize={0.8}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
            material-transparent={true}
            material-opacity={Math.random() * 0.5 + 0.2}
          >
            {pos.char}
          </Text>
        </Float>
      ))}
    </group>
  )
} 