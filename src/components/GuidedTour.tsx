"use client"

import { useRef, useState, useEffect } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"
import { gsap } from "gsap"
import { topics, papers } from "@/data/embeddingData"

// Tour stop interface
interface TourStop {
  title: string
  description: string
  target: {
    position: THREE.Vector3
    lookAt?: THREE.Vector3
  }
  duration: number
  entities: {
    type: "topic" | "paper"
    id: string
    highlight: boolean
  }[]
  narration?: string
}

interface GuidedTourProps {
  isActive: boolean
  onComplete: () => void
  onStop: () => void
}

export default function GuidedTour({ isActive, onComplete, onStop }: GuidedTourProps) {
  const { camera, scene } = useThree()
  const [currentStopIndex, setCurrentStopIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showNarration, setShowNarration] = useState(false)
  const [narrationText, setNarrationText] = useState("")
  const tourRef = useRef<THREE.Group>(null!)
  const originalCameraPosition = useRef(new THREE.Vector3())
  const originalCameraRotation = useRef(new THREE.Euler())
  const timeline = useRef<gsap.core.Timeline | null>(null)
  
  // Define the tour stops
  const tourStops = useRef<TourStop[]>([
    {
      title: "Welcome to My Research",
      description: "Let's explore the key areas of my work",
      target: {
        position: new THREE.Vector3(0, 0, 20),
        lookAt: new THREE.Vector3(0, 0, 0)
      },
      duration: 5,
      entities: [],
      narration: "Welcome to an interactive journey through my research. I'll guide you through the main topics and key papers that define my work."
    },
    {
      title: "Agents",
      description: "Exploring multi-agent systems and emergent behavior",
      target: {
        position: new THREE.Vector3(-6, 3, 5),
        lookAt: new THREE.Vector3(-8, 4, 0)
      },
      duration: 8,
      entities: [
        { type: "topic", id: "t1", highlight: true },
        { type: "paper", id: "p1", highlight: true },
        { type: "paper", id: "p3", highlight: false },
        { type: "paper", id: "p7", highlight: false }
      ],
      narration: "My work on agents focuses on how individual entities interact to create complex systems. This research explores emergent behaviors and collective intelligence."
    },
    {
      title: "Embeddings",
      description: "Vector representations and semantic spaces",
      target: {
        position: new THREE.Vector3(6, -1, 7),
        lookAt: new THREE.Vector3(8, -2, 2)
      },
      duration: 8,
      entities: [
        { type: "topic", id: "t2", highlight: true },
        { type: "paper", id: "p2", highlight: true },
        { type: "paper", id: "p5", highlight: false },
        { type: "paper", id: "p8", highlight: false }
      ],
      narration: "Embeddings are mathematical representations that capture semantic relationships. My research explores how these vector spaces can reveal hidden patterns in complex data."
    },
    {
      title: "Leadership",
      description: "Team dynamics and organizational behavior",
      target: {
        position: new THREE.Vector3(-3, -3, 3),
        lookAt: new THREE.Vector3(-4, -4, -2)
      },
      duration: 8,
      entities: [
        { type: "topic", id: "t3", highlight: true },
        { type: "paper", id: "p4", highlight: true },
        { type: "paper", id: "p6", highlight: false }
      ],
      narration: "My leadership research investigates how teams function and how leadership emerges in complex systems. This work bridges organizational psychology and complexity science."
    },
    {
      title: "Connecting the Dots",
      description: "How these research areas interconnect",
      target: {
        position: new THREE.Vector3(0, 5, 15),
        lookAt: new THREE.Vector3(0, 0, 0)
      },
      duration: 10,
      entities: [
        { type: "topic", id: "t1", highlight: true },
        { type: "topic", id: "t2", highlight: true },
        { type: "topic", id: "t3", highlight: true },
        { type: "topic", id: "t4", highlight: true },
        { type: "paper", id: "p1", highlight: true },
        { type: "paper", id: "p2", highlight: true },
        { type: "paper", id: "p4", highlight: true }
      ],
      narration: "The most exciting aspects of my research emerge at the intersections of these fields. By connecting agents, embeddings, and leadership theories, we can develop new approaches to understanding complex systems."
    }
  ]).current
  
  // Initialize tour when activated
  useEffect(() => {
    if (isActive && currentStopIndex === -1) {
      // Store original camera position to restore later
      originalCameraPosition.current.copy(camera.position)
      originalCameraRotation.current.copy(camera.rotation)
      
      // Start the tour
      setCurrentStopIndex(0)
      setIsPlaying(true)
    }
    
    // Clean up when tour is deactivated
    if (!isActive && currentStopIndex !== -1) {
      resetTour()
    }
  }, [isActive, camera])
  
  // Handle tour stop changes
  useEffect(() => {
    if (currentStopIndex >= 0 && currentStopIndex < tourStops.length) {
      playCurrentStop()
    } else if (currentStopIndex >= tourStops.length) {
      finishTour()
    }
  }, [currentStopIndex])
  
  // Play the current tour stop
  const playCurrentStop = () => {
    const currentStop = tourStops[currentStopIndex]
    
    // Kill any existing animations
    if (timeline.current) {
      timeline.current.kill()
    }
    
    // Create a new timeline
    timeline.current = gsap.timeline({
      onComplete: () => {
        // Wait a moment before moving to next stop
        setTimeout(() => {
          if (isPlaying) {
            setCurrentStopIndex(prev => prev + 1)
          }
        }, 1000)
      }
    })
    
    // Show narration
    setNarrationText(currentStop.narration || "")
    setShowNarration(true)
    
    // Animate camera to target position
    timeline.current.to(camera.position, {
      x: currentStop.target.position.x,
      y: currentStop.target.position.y,
      z: currentStop.target.position.z,
      duration: 2,
      ease: "power2.inOut"
    })
    
    // If lookAt is specified, animate camera to look at target
    if (currentStop.target.lookAt) {
      const lookAtVector = currentStop.target.lookAt
      
      // Create a dummy object to animate the lookAt
      const dummyObject = { x: 0, y: 0, z: 0 }
      timeline.current.to(dummyObject, {
        x: 1,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(lookAtVector)
        }
      }, "<")
    }
    
    // Highlight relevant entities
    highlightEntities(currentStop.entities)
    
    // Add a pause at the end of each stop
    timeline.current.to({}, { duration: currentStop.duration - 2 })
  }
  
  // Highlight the specified entities
  const highlightEntities = (entities: TourStop["entities"]) => {
    // Reset all highlights first
    scene.traverse((object) => {
      if (object.userData.type === "topic" || object.userData.type === "paper") {
        // Reset to normal appearance
        if (object.material) {
          gsap.to(object.material, {
            opacity: 0.7,
            emissive: new THREE.Color(0x000000),
            duration: 1
          })
        }
        
        // Reset scale
        gsap.to(object.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1
        })
      }
    })
    
    // Apply highlights to specified entities
    entities.forEach(entity => {
      const objectId = entity.id
      
      scene.traverse((object) => {
        if (object.userData.id === objectId) {
          if (entity.highlight) {
            // Highlight with glow and scale
            if (object.material) {
              gsap.to(object.material, {
                opacity: 1,
                emissive: new THREE.Color(0x333333),
                duration: 1
              })
            }
            
            // Scale up slightly
            gsap.to(object.scale, {
              x: 1.2,
              y: 1.2,
              z: 1.2,
              duration: 1
            })
          } else {
            // Semi-highlight (just make visible)
            if (object.material) {
              gsap.to(object.material, {
                opacity: 0.9,
                duration: 1
              })
            }
          }
        }
      })
    })
  }
  
  // Reset the tour
  const resetTour = () => {
    // Kill any active animations
    if (timeline.current) {
      timeline.current.kill()
    }
    
    // Reset camera to original position
    gsap.to(camera.position, {
      x: originalCameraPosition.current.x,
      y: originalCameraPosition.current.y,
      z: originalCameraPosition.current.z,
      duration: 2,
      ease: "power2.inOut"
    })
    
    // Reset camera rotation
    gsap.to(camera.rotation, {
      x: originalCameraRotation.current.x,
      y: originalCameraRotation.current.y,
      z: originalCameraRotation.current.z,
      duration: 2,
      ease: "power2.inOut"
    })
    
    // Reset all highlights
    scene.traverse((object) => {
      if (object.userData.type === "topic" || object.userData.type === "paper") {
        // Reset to normal appearance
        if (object.material) {
          gsap.to(object.material, {
            opacity: 0.7,
            emissive: new THREE.Color(0x000000),
            duration: 1
          })
        }
        
        // Reset scale
        gsap.to(object.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1
        })
      }
    })
    
    // Hide narration
    setShowNarration(false)
    
    // Reset state
    setCurrentStopIndex(-1)
    setIsPlaying(false)
  }
  
  // Finish the tour
  const finishTour = () => {
    resetTour()
    onComplete()
  }
  
  // Handle tour controls
  const handlePause = () => {
    setIsPlaying(false)
    if (timeline.current) {
      timeline.current.pause()
    }
  }
  
  const handlePlay = () => {
    setIsPlaying(true)
    if (timeline.current) {
      timeline.current.play()
    }
  }
  
  const handleStop = () => {
    resetTour()
    onStop()
  }
  
  const handleNext = () => {
    if (currentStopIndex < tourStops.length - 1) {
      setCurrentStopIndex(prev => prev + 1)
    } else {
      finishTour()
    }
  }
  
  const handlePrevious = () => {
    if (currentStopIndex > 0) {
      setCurrentStopIndex(prev => prev - 1)
    }
  }
  
  // Only render if tour is active
  if (!isActive) return null
  
  return (
    <group ref={tourRef}>
      {/* Narration text */}
      {showNarration && (
        <group position={[0, -8, -10]} rotation={[0, 0, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[20, 5]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.5}
            maxWidth={18}
            lineHeight={1.2}
            textAlign="center"
            color="#ffffff"
          >
            {narrationText}
          </Text>
        </group>
      )}
      
      {/* Tour controls - positioned at bottom of screen */}
      <group position={[0, -10, -10]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[10, 1.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
        
        {/* Previous button */}
        <group position={[-4, 0, 0.1]} onClick={handlePrevious}>
          <mesh>
            <planeGeometry args={[1.5, 1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <Text position={[0, 0, 0.1]} fontSize={0.4} color="#ffffff">
            Prev
          </Text>
        </group>
        
        {/* Play/Pause button */}
        <group position={[-2, 0, 0.1]} onClick={isPlaying ? handlePause : handlePlay}>
          <mesh>
            <planeGeometry args={[1.5, 1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <Text position={[0, 0, 0.1]} fontSize={0.4} color="#ffffff">
            {isPlaying ? "Pause" : "Play"}
          </Text>
        </group>
        
        {/* Stop button */}
        <group position={[0, 0, 0.1]} onClick={handleStop}>
          <mesh>
            <planeGeometry args={[1.5, 1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <Text position={[0, 0, 0.1]} fontSize={0.4} color="#ffffff">
            Stop
          </Text>
        </group>
        
        {/* Next button */}
        <group position={[2, 0, 0.1]} onClick={handleNext}>
          <mesh>
            <planeGeometry args={[1.5, 1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <Text position={[0, 0, 0.1]} fontSize={0.4} color="#ffffff">
            Next
          </Text>
        </group>
        
        {/* Progress indicator */}
        <Text position={[4, 0, 0.1]} fontSize={0.4} color="#ffffff">
          {`${currentStopIndex + 1}/${tourStops.length}`}
        </Text>
      </group>
    </group>
  )
} 