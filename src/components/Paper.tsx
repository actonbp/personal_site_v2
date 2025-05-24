"use client"

import { useRef, useMemo, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import PaperGraphic from "./graphics/PaperGraphic"
import PaperDetail from "./PaperDetail"
import dynamic from "next/dynamic"

// Dynamically import mobile-specific component
const MobilePaper = dynamic(() => import("./mobile/MobilePaper"), { ssr: false })

type PaperProps = {
  title: string
  abstract: string
  position: [number, number, number]
  isVisible: boolean
  topicPosition: [number, number, number]
  onPaperClick?: () => void
}


export default function Paper({ title, abstract, position, isVisible, topicPosition, onPaperClick }: PaperProps) {
  const lineRef = useRef<THREE.Line>(null!)
  const particlesRef = useRef<THREE.Points>(null!)
  const groupRef = useRef<THREE.Group>(null!)
  const [showDetail, setShowDetail] = useState(false)

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

  // Create flowing particles along the line
  const particleCount = 50
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount
      positions[i * 3] = position[0] * (1 - t) + topicPosition[0] * t
      positions[i * 3 + 1] = position[1] * (1 - t) + topicPosition[1] * t
      positions[i * 3 + 2] = position[2] * (1 - t) + topicPosition[2] * t
    }
    return positions
  }, [position, topicPosition])

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  
  const particleMaterial = new THREE.PointsMaterial({
    color: "#00ff00",
    size: 0.1,
    transparent: true,
    opacity: isVisible ? 0.6 : 0,
    blending: THREE.AdditiveBlending
  })

  useFrame((state) => {
    if (lineRef.current && isVisible && !showDetail) {
      // Add subtle pulsing effect to the line
      const pulseOpacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      if (lineRef.current.material instanceof THREE.LineBasicMaterial) {
        lineRef.current.material.opacity = pulseOpacity
      }

      // Animate particles
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < particleCount; i++) {
          const t = ((i / particleCount) + state.clock.elapsedTime * 0.5) % 1
          positions[i * 3] = position[0] * (1 - t) + topicPosition[0] * t
          positions[i * 3 + 1] = position[1] * (1 - t) + topicPosition[1] * t
          positions[i * 3 + 2] = position[2] * (1 - t) + topicPosition[2] * t
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        
        // Pulse particle size
        if (particlesRef.current.material instanceof THREE.PointsMaterial) {
          particlesRef.current.material.size = 0.1 + Math.sin(state.clock.elapsedTime * 4) * 0.05
        }
      }
    }
  })

  const handlePaperClick = () => {
    setShowDetail(true)
    if (onPaperClick) onPaperClick()
  }

  return (
    <group ref={groupRef} userData={{ type: 'paper', title: title }}>
      <primitive object={new THREE.Line(lineGeometry, lineMaterial)} ref={lineRef} />
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />
      <PaperGraphic
        title={title}
        position={position}
        isVisible={isVisible && !showDetail}
        onClick={handlePaperClick}
      />
      <PaperDetail
        title={title}
        abstract={abstract}
        isActive={showDetail}
        paperPosition={position}
        onClose={() => setShowDetail(false)}
      />
      <MobilePaper 
        paperRef={groupRef} 
        isDetailActive={showDetail} 
      />
    </group>
  )
} 