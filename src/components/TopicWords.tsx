"use client"

import { useState, useRef } from "react"
import { Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import Paper from "./Paper"

type Topic = {
  name: string
  position: [number, number, number]
  papers: Array<{
    title: string
    position: [number, number, number]
  }>
}

const topics: Topic[] = [
  { 
    name: "Agents",
    position: [-8, 4, 0],
    papers: [
      { title: "Emergent Agent Behavior", position: [-12, 6, 2] },
      { title: "Multi-Agent Systems", position: [-10, 2, -2] },
      { title: "Agent-Based Learning", position: [-6, 5, -3] }
    ]
  },
  { 
    name: "Embeddings",
    position: [8, -2, 2],
    papers: [
      { title: "Vector Representations", position: [12, 0, 4] },
      { title: "Semantic Spaces", position: [6, -4, 0] },
      { title: "Embedding Techniques", position: [10, -1, -2] }
    ]
  },
  { 
    name: "Leadership",
    position: [-4, -4, -2],
    papers: [
      { title: "Team Dynamics", position: [-6, -6, -4] },
      { title: "Leadership Styles", position: [-2, -3, 0] },
      { title: "Organizational Behavior", position: [-8, -2, -1] }
    ]
  },
  { 
    name: "Teams",
    position: [4, 2, -4],
    papers: [
      { title: "Collaboration Models", position: [6, 4, -6] },
      { title: "Team Performance", position: [2, 0, -2] },
      { title: "Group Psychology", position: [8, 1, -3] }
    ]
  },
  { 
    name: "Memory",
    position: [-6, 0, 4],
    papers: [
      { title: "Memory Systems", position: [-8, 2, 6] },
      { title: "Cognitive Models", position: [-4, -2, 3] },
      { title: "Learning & Memory", position: [-9, 1, 2] }
    ]
  },
  { 
    name: "Identity",
    position: [0, -2, -4],
    papers: [
      { title: "Self Concept", position: [2, -4, -6] },
      { title: "Social Identity", position: [-2, -1, -2] },
      { title: "Identity Formation", position: [4, -3, -3] }
    ]
  }
]

export default function TopicWords() {
  const [focusedTopic, setFocusedTopic] = useState<string | null>(null)
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const textRefs = useRef<{ [key: string]: THREE.Mesh }>({})

  useFrame((state, delta) => {
    Object.entries(textRefs.current).forEach(([name, mesh]) => {
      if (!focusedTopic || name === focusedTopic) {
        mesh.position.y += Math.sin(state.clock.elapsedTime + mesh.position.x) * delta * 0.4
      }
    })
  })

  const topicPositions = topics.reduce((acc, topic) => {
    acc[topic.name] = topic.position
    return acc
  }, {} as { [key: string]: [number, number, number] })

  return (
    <>
      <group>
        {topics.map((topic) => {
          const isVisible = !focusedTopic || focusedTopic === topic.name
          const isHovered = hoveredTopic === topic.name
          const scale = isHovered ? 2 : 1.5
          const color = focusedTopic === topic.name ? "#ffffff" : isHovered ? "#ffff00" : "#00ff00"
          const opacity = isVisible ? 1 : 0.1

          return (
            <group key={topic.name}>
              <Text
                ref={(ref) => {
                  if (ref) textRefs.current[topic.name] = ref
                }}
                position={topic.position}
                fontSize={1.5}
                maxWidth={200}
                lineHeight={1}
                letterSpacing={0.05}
                textAlign="center"
                font="/fonts/Inter-Bold.woff"
                anchorX="center"
                anchorY="middle"
                material-transparent={true}
                material-opacity={opacity}
                scale={[scale, scale, scale]}
                onClick={(event) => {
                  event.stopPropagation()
                  setFocusedTopic(focusedTopic === topic.name ? null : topic.name)
                }}
                onPointerOver={(event) => {
                  event.stopPropagation()
                  document.body.style.cursor = "pointer"
                  setHoveredTopic(topic.name)
                }}
                onPointerOut={(event) => {
                  event.stopPropagation()
                  document.body.style.cursor = "default"
                  setHoveredTopic(null)
                }}
              >
                {topic.name}
              </Text>
              {/* Render papers for this topic */}
              {topic.papers.map((paper, index) => (
                <Paper
                  key={paper.title}
                  title={paper.title}
                  position={paper.position}
                  isVisible={focusedTopic === topic.name}
                  topicPosition={topic.position}
                />
              ))}
            </group>
          )
        })}
      </group>
    </>
  )
}

