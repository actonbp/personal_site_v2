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
    abstract: string
    position: [number, number, number]
  }>
}

type TopicWordsProps = {
  topics: string[]
  onFocus: (topic: string | null) => void
  focusedTopic: string | null
}

const topicData: Topic[] = [
  {
    name: "Agents",
    position: [-8, 4, 0],
    papers: [
      {
        title: "Emergent Agent Behavior",
        abstract: "Study of spontaneous coordination among autonomous agents.",
        position: [-12, 6, 2]
      },
      {
        title: "Multi-Agent Systems",
        abstract: "Overview of architectures enabling many agents to cooperate.",
        position: [-10, 2, -2]
      },
      {
        title: "Agent-Based Learning",
        abstract: "Examines reinforcement strategies for adaptive agents.",
        position: [-6, 5, -3]
      },
      {
        title: "Coordinated Autonomy",
        abstract: "Techniques for balancing independence and teamwork.",
        position: [-9, 3, 1]
      },
      {
        title: "Ethical Agency",
        abstract: "Considers moral frameworks for autonomous decision making.",
        position: [-7, 4, -1]
      }
    ]
  },
  {
    name: "Embeddings",
    position: [8, -2, 2],
    papers: [
      {
        title: "Vector Representations",
        abstract: "Survey of vector encoding methods in NLP.",
        position: [12, 0, 4]
      },
      {
        title: "Semantic Spaces",
        abstract: "Describes embedding spaces capturing concept relationships.",
        position: [6, -4, 0]
      },
      {
        title: "Embedding Techniques",
        abstract: "Comparison of approaches for generating embeddings.",
        position: [10, -1, -2]
      },
      {
        title: "Cross-Lingual Mapping",
        abstract: "Methods for aligning embeddings across languages.",
        position: [9, 2, -1]
      },
      {
        title: "Temporal Embeddings",
        abstract: "Captures evolving semantics through time-sensitive vectors.",
        position: [11, -3, 2]
      }
    ]
  },
  {
    name: "Leadership",
    position: [-4, -4, -2],
    papers: [
      {
        title: "Team Dynamics",
        abstract: "Analyzes group interaction patterns impacting performance.",
        position: [-6, -6, -4]
      },
      {
        title: "Leadership Styles",
        abstract: "Explores transformational vs transactional leadership modes.",
        position: [-2, -3, 0]
      },
      {
        title: "Organizational Behavior",
        abstract: "Studies how structure influences leadership outcomes.",
        position: [-8, -2, -1]
      },
      {
        title: "Remote Leadership",
        abstract: "Addresses challenges of leading distributed teams.",
        position: [-5, -5, 1]
      },
      {
        title: "Adaptive Strategy",
        abstract: "Outlines responsive leadership during change.",
        position: [-3, -6, -2]
      }
    ]
  },
  {
    name: "Consciousness",
    position: [4, 2, -4],
    papers: [
      {
        title: "Theories of Mind",
        abstract: "Reviews philosophical and scientific views of awareness.",
        position: [6, 4, -6]
      },
      {
        title: "Cognitive Science",
        abstract: "Integrates findings on mental processes and consciousness.",
        position: [2, 0, -2]
      },
      {
        title: "Phenomenal Experience",
        abstract: "Focuses on subjective qualities of conscious states.",
        position: [8, 1, -3]
      },
      {
        title: "Neural Correlates",
        abstract: "Examines brain activity patterns linked to experience.",
        position: [5, 3, -5]
      },
      {
        title: "Global Workspace Models",
        abstract: "Describes frameworks for unified conscious processing.",
        position: [7, 2, -7]
      }
    ]
  },
  {
    name: "Cognition",
    position: [-6, 0, 4],
    papers: [
      {
        title: "Memory Systems",
        abstract: "Overview of short-term and long-term memory mechanisms.",
        position: [-8, 2, 6]
      },
      {
        title: "Cognitive Models",
        abstract: "Presents computational models of reasoning.",
        position: [-4, -2, 3]
      },
      {
        title: "Learning & Memory",
        abstract: "Links learning theory with memory formation.",
        position: [-9, 1, 2]
      },
      {
        title: "Decision Making",
        abstract: "Discusses cognitive factors in choosing actions.",
        position: [-5, -1, 4]
      },
      {
        title: "Attention Mechanisms",
        abstract: "Investigates how attention guides perception.",
        position: [-7, 0, 5]
      }
    ]
  },
  {
    name: "Emergence",
    position: [0, -2, -4],
    papers: [
      {
        title: "Complex Systems",
        abstract: "Introduces principles of complex adaptive systems.",
        position: [2, -4, -6]
      },
      {
        title: "Emergent Behavior",
        abstract: "Explores how simple rules lead to rich behaviors.",
        position: [-2, -1, -2]
      },
      {
        title: "Self-Organization",
        abstract: "Describes spontaneous order in decentralized systems.",
        position: [4, -3, -3]
      },
      {
        title: "Collective Intelligence",
        abstract: "Studies intelligence arising from group interaction.",
        position: [1, -2, -5]
      },
      {
        title: "Pattern Formation",
        abstract: "Analyzes repeating structures emerging in nature.",
        position: [3, -5, -4]
      }
    ]
  }
]

export default function TopicWords({ topics, onFocus, focusedTopic }: TopicWordsProps) {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const textRefs = useRef<{ [key: string]: THREE.Mesh }>({})

  useFrame((state, delta) => {
    Object.entries(textRefs.current).forEach(([name, mesh]) => {
      if (!focusedTopic || name === focusedTopic) {
        mesh.position.y += Math.sin(state.clock.elapsedTime + mesh.position.x) * delta * 0.4
      }
    })
  })

  // Filter topicData to only include topics from the props
  const visibleTopics = topicData.filter(topic => topics.includes(topic.name))

  return (
    <>
      <group>
        {visibleTopics.map((topic) => {
          const isVisible = !focusedTopic || focusedTopic === topic.name
          const isHovered = hoveredTopic === topic.name
          const scale = isHovered ? 2 : 1.5
          const color = focusedTopic === topic.name ? "#ffffff" : isHovered ? "#ffff00" : "#a78bfa"
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
                font="/fonts/Inter-Bold.ttf"
                anchorX="center"
                anchorY="middle"
                material-transparent={true}
                material-opacity={opacity}
                color={color}
                scale={[scale, scale, scale]}
                onClick={(event) => {
                  event.stopPropagation()
                  const newTopic = focusedTopic === topic.name ? null : topic.name
                  onFocus(newTopic)
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
                userData={{ type: 'topic', name: topic.name }}
              >
                {topic.name}
              </Text>
              {/* Render papers for this topic */}
              {topic.papers.map((paper, index) => (
                <Paper
                  key={paper.title}
                  title={paper.title}
                  abstract={paper.abstract}
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

