"use client"

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

// Sample data structure for papers
interface Paper {
  id: string
  title: string
  abstract: string
  author: string
  embedding: [number, number, number] // 3D position in embedding space
  topics: string[]
  year: number
  citations: number
}

// Sample data structure for topics
interface Topic {
  id: string
  name: string
  embedding: [number, number, number] // 3D position in embedding space
  papers: string[] // IDs of related papers
  color: string
}

interface EmbeddingSpaceProps {
  papers: Paper[]
  topics: Topic[]
  onPaperSelect: (paper: Paper) => void
  onTopicSelect: (topic: Topic) => void
  selectedPaper: string | null
  selectedTopic: string | null
}

export default function EmbeddingSpace({ 
  papers, 
  topics, 
  onPaperSelect, 
  onTopicSelect,
  selectedPaper,
  selectedTopic
}: EmbeddingSpaceProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hoveredPaper, setHoveredPaper] = useState<string | null>(null)
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  
  // Create connections between papers and topics
  const connections = useMemo(() => {
    const lines: { start: THREE.Vector3, end: THREE.Vector3, color: string }[] = []
    
    // Only show connections for selected/hovered topics or papers
    if (selectedTopic || hoveredTopic) {
      const topicId = selectedTopic || hoveredTopic
      const topic = topics.find(t => t.id === topicId)
      
      if (topic) {
        const topicPos = new THREE.Vector3(...topic.embedding)
        
        // Connect topic to all its papers
        topic.papers.forEach(paperId => {
          const paper = papers.find(p => p.id === paperId)
          if (paper) {
            lines.push({
              start: topicPos,
              end: new THREE.Vector3(...paper.embedding),
              color: topic.color
            })
          }
        })
      }
    }
    
    if (selectedPaper || hoveredPaper) {
      const paperId = selectedPaper || hoveredPaper
      const paper = papers.find(p => p.id === paperId)
      
      if (paper) {
        const paperPos = new THREE.Vector3(...paper.embedding)
        
        // Connect paper to all its topics
        paper.topics.forEach(topicId => {
          const topic = topics.find(t => t.id === topicId)
          if (topic) {
            lines.push({
              start: paperPos,
              end: new THREE.Vector3(...topic.embedding),
              color: topic.color
            })
          }
        })
      }
    }
    
    return lines
  }, [papers, topics, selectedPaper, selectedTopic, hoveredPaper, hoveredTopic])
  
  // Gentle animation
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle breathing animation for the entire space
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Render papers as spheres */}
      {papers.map(paper => {
        const isSelected = paper.id === selectedPaper
        const isHovered = paper.id === hoveredPaper
        const scale = isSelected ? 1.5 : isHovered ? 1.2 : 1
        
        return (
          <group key={paper.id} position={paper.embedding}>
            <mesh
              scale={[scale, scale, scale]}
              onClick={() => onPaperSelect(paper)}
              onPointerOver={() => setHoveredPaper(paper.id)}
              onPointerOut={() => setHoveredPaper(null)}
            >
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial 
                color="#ffffff"
                emissive="#6b46c1" 
                emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : 0.2}
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            
            {/* Paper label */}
            {(isSelected || isHovered) && (
              <Html
                position={[0, 0.5, 0]}
                center
                distanceFactor={10}
                occlude
              >
                <div className="bg-black bg-opacity-80 text-white p-2 rounded text-sm whitespace-nowrap">
                  {paper.title}
                </div>
              </Html>
            )}
          </group>
        )
      })}
      
      {/* Render topics as larger, colored spheres */}
      {topics.map(topic => {
        const isSelected = topic.id === selectedTopic
        const isHovered = topic.id === hoveredTopic
        const scale = isSelected ? 1.5 : isHovered ? 1.2 : 1
        
        return (
          <group key={topic.id} position={topic.embedding}>
            <mesh
              scale={[scale, scale, scale]}
              onClick={() => onTopicSelect(topic)}
              onPointerOver={() => setHoveredTopic(topic.id)}
              onPointerOut={() => setHoveredTopic(null)}
            >
              <sphereGeometry args={[0.6, 24, 24]} />
              <meshStandardMaterial 
                color={topic.color}
                emissive={topic.color}
                emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : 0.2}
                transparent
                opacity={0.8}
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
            
            {/* Topic label */}
            <Text
              position={[0, 0.8, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {topic.name}
            </Text>
          </group>
        )
      })}
      
      {/* Render connections */}
      {connections.map((connection, i) => (
        <line key={i}>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attachObject={['attributes', 'position']}
              array={new Float32Array([
                connection.start.x, connection.start.y, connection.start.z,
                connection.end.x, connection.end.y, connection.end.z
              ])}
              count={2}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            attach="material"
            color={connection.color}
            linewidth={1}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  )
} 