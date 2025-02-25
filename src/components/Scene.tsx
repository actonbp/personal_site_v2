"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Points, PointMaterial, Text, Line } from "@react-three/drei"
import * as THREE from "three"
import { papers, topics } from "@/data/embeddingData"

// Background particle settings
const particleCount = 1000
const particleSize = 0.05

export default function Scene() {
  const [hoveredPaper, setHoveredPaper] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  
  // Refs for animations
  const pointsRef = useRef<THREE.Points>(null!)
  const topicsGroupRef = useRef<THREE.Group>(null!)
  const papersGroupRef = useRef<THREE.Group>(null!)
  
  // Create background particles
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    return positions
  }, [])
  
  // Create connections between papers and topics
  const connections = useMemo(() => {
    const lines: { start: THREE.Vector3, end: THREE.Vector3, color: string, opacity: number }[] = []
    
    // Create connections for selected or hovered topics
    const activeTopicId = selectedTopic || hoveredTopic
    if (activeTopicId) {
      const topic = topics.find(t => t.id === activeTopicId)
      if (topic) {
        const topicPos = new THREE.Vector3(...topic.embedding)
        
        // Connect to all related papers
        topic.papers.forEach(paperId => {
          const paper = papers.find(p => p.id === paperId)
          if (paper) {
            lines.push({
              start: topicPos,
              end: new THREE.Vector3(...paper.embedding),
              color: topic.color,
              opacity: selectedTopic ? 0.8 : 0.5
            })
          }
        })
      }
    }
    
    // Create connections for selected or hovered papers
    const activePaperId = selectedPaper || hoveredPaper
    if (activePaperId) {
      const paper = papers.find(p => p.id === activePaperId)
      if (paper) {
        const paperPos = new THREE.Vector3(...paper.embedding)
        
        // Connect to all related topics
        paper.topics.forEach(topicId => {
          const topic = topics.find(t => t.id === topicId)
          if (topic) {
            // Only add if not already added
            if (!activeTopicId || activeTopicId !== topic.id) {
              lines.push({
                start: paperPos,
                end: new THREE.Vector3(...topic.embedding),
                color: topic.color,
                opacity: selectedPaper ? 0.8 : 0.5
              })
            }
          }
        })
      }
    }
    
    return lines
  }, [selectedTopic, hoveredTopic, selectedPaper, hoveredPaper])
  
  // Animation loop
  useFrame((state, delta) => {
    // Rotate background particles
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05
      pointsRef.current.rotation.x += delta * 0.02
    }
    
    // Gentle floating animation for topics
    if (topicsGroupRef.current) {
      topicsGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
    
    // Subtle rotation for papers
    if (papersGroupRef.current) {
      papersGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
    }
  })
  
  return (
    <group position={[0, 0, -10]}>
      {/* Additional particles */}
      <Points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <PointMaterial
          size={particleSize}
          sizeAttenuation={true}
          depthWrite={false}
          transparent
          opacity={0.4}
          color="#a78bfa"
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Topic nodes */}
      <group ref={topicsGroupRef}>
        {topics.map(topic => {
          const isActive = topic.id === selectedTopic || topic.id === hoveredTopic
          const scale = isActive ? 1.3 : 1
          
          return (
            <group key={topic.id} position={topic.embedding}>
              {/* Topic sphere */}
              <mesh
                scale={[scale, scale, scale]}
                onClick={() => setSelectedTopic(topic.id === selectedTopic ? null : topic.id)}
                onPointerOver={() => setHoveredTopic(topic.id)}
                onPointerOut={() => setHoveredTopic(null)}
              >
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial
                  color={topic.color}
                  emissive={topic.color}
                  emissiveIntensity={isActive ? 0.8 : 0.4}
                  transparent
                  opacity={0.8}
                  roughness={0.2}
                  metalness={0.8}
                />
              </mesh>
              
              {/* Glow effect */}
              <mesh scale={[1.2 * scale, 1.2 * scale, 1.2 * scale]}>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshBasicMaterial
                  color={topic.color}
                  transparent
                  opacity={0.15}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Topic label - only show when active */}
              {isActive && (
                <Text
                  position={[0, 1.0, 0]}
                  fontSize={0.3}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.02}
                  outlineColor="#000000"
                >
                  {topic.name}
                </Text>
              )}
              
              {/* Paper count - only show when active */}
              {isActive && (
                <Text
                  position={[0, -1.0, 0]}
                  fontSize={0.25}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                >
                  {topic.papers.length} papers
                </Text>
              )}
            </group>
          )
        })}
      </group>
      
      {/* Paper nodes */}
      <group ref={papersGroupRef}>
        {papers.map(paper => {
          const isActive = paper.id === selectedPaper || paper.id === hoveredPaper
          const scale = isActive ? 1.3 : 1
          
          // Get the primary topic color (first topic)
          const primaryTopic = paper.topics.length > 0 
            ? topics.find(t => t.id === paper.topics[0]) 
            : null
          const paperColor = primaryTopic ? primaryTopic.color : "#ffffff"
          
          return (
            <group key={paper.id} position={paper.embedding}>
              {/* Paper sphere */}
              <mesh
                scale={[scale, scale, scale]}
                onClick={() => setSelectedPaper(paper.id === selectedPaper ? null : paper.id)}
                onPointerOver={() => setHoveredPaper(paper.id)}
                onPointerOut={() => setHoveredPaper(null)}
              >
                <sphereGeometry args={[0.3, 24, 24]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive={paperColor}
                  emissiveIntensity={isActive ? 0.8 : 0.3}
                  roughness={0.3}
                  metalness={0.7}
                />
              </mesh>
              
              {/* Paper label (only show when active) */}
              {isActive && (
                <group>
                  <Text
                    position={[0, 0.6, 0]}
                    fontSize={0.2}
                    maxWidth={3}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                  >
                    {paper.title}
                  </Text>
                  
                  <Text
                    position={[0, -0.6, 0]}
                    fontSize={0.15}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {paper.year} • {paper.citations} citations
                  </Text>
                </group>
              )}
            </group>
          )
        })}
      </group>
      
      {/* Connections between papers and topics */}
      {connections.map((connection, i) => (
        <Line
          key={i}
          points={[connection.start, connection.end]}
          color={connection.color}
          lineWidth={1}
          transparent
          opacity={connection.opacity}
          blending={THREE.AdditiveBlending}
        />
      ))}
    </group>
  )
}

