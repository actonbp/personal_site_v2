"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"

const particleCount = 4000

export default function Scene() {
  const points = useRef<THREE.Points>(null!)
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40
  }

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.15
    }
  })

  return (
    <group>
      <Points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <PointMaterial
          size={0.15}
          sizeAttenuation={true}
          depthWrite={false}
          transparent
          opacity={0.9}
          color="#00ff00"
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  )
}

