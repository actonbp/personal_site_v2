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

interface MobileGuidedTourProps {
  isActive: boolean
  onComplete: () => void
  onStop: () => void
}

export default function MobileGuidedTour({ isActive, onComplete, onStop }: MobileGuidedTourProps) {
  const { camera, scene } = useThree()
  const [currentStopIndex, setCurrentStopIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showNarration, setShowNarration] = useState(false)
  const [narrationText, setNarrationText] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const tourRef = useRef<THREE.Group>(null!)
  const originalCameraPosition = useRef(new THREE.Vector3())
  const originalCameraRotation = useRef(new THREE.Euler())
  const timeline = useRef<gsap.core.Timeline | null>(null)
  
  // Check if we're on a mobile device
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])
  
  // Only proceed if on mobile
  if (!isMobile) return null
  
  // Define the tour stops - optimized for mobile viewing angles
  const tourStops = useRef<TourStop[]>([
    {
      title: "Welcome",
      description: "Let's explore my research",
      target: {
        position: new THREE.Vector3(0, 0, 15),
        lookAt: new THREE.Vector3(0, 0, 0)
      },
      duration: 5,
      entities: [],
      narration: "Welcome to my research visualization. Let's take a quick tour of my work."
    },
    {
      title: "Agents",
      description: "Multi-agent systems",
      target: {
        position: new THREE.Vector3(-6, 3, 5),
        lookAt: new THREE.Vector3(-8, 4, 0)
      },
      duration: 6,
      entities: [
        { type: "topic", id: "t1", highlight: true },
        { type: "paper", id: "p1", highlight: true }
      ],
      narration: "My work on agents explores how individual entities create complex systems and emergent behaviors."
    },
    {
      title: "Embeddings",
      description: "Vector representations",
      target: {
        position: new THREE.Vector3(6, -1, 7),
        lookAt: new THREE.Vector3(8, -2, 2)
      },
      duration: 6,
      entities: [
        { type: "topic", id: "t2", highlight: true },
        { type: "paper", id: "p2", highlight: true }
      ],
      narration: "Embeddings are mathematical representations that capture semantic relationships in data."
    },
    {
      title: "Leadership",
      description: "Team dynamics",
      target: {
        position: new THREE.Vector3(-3, -3, 3),
        lookAt: new THREE.Vector3(-4, -4, -2)
      },
      duration: 6,
      entities: [
        { type: "topic", id: "t3", highlight: true },
        { type: "paper", id: "p4", highlight: true }
      ],
      narration: "My leadership research investigates how teams function and how leadership emerges in complex systems."
    },
    {
      title: "Overview",
      description: "Research connections",
      target: {
        position: new THREE.Vector3(0, 5, 12),
        lookAt: new THREE.Vector3(0, 0, 0)
      },
      duration: 8,
      entities: [
        { type: "topic", id: "t1", highlight: true },
        { type: "topic", id: "t2", highlight: true },
        { type: "topic", id: "t3", highlight: true },
        { type: "topic", id: "t4", highlight: true }
      ],
      narration: "The most exciting aspects of my research emerge at the intersections of these fields, creating new approaches to understanding complex systems."
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
  
  // Only render if tour is active
  if (!isActive) return null
  
  return (
    <group ref={tourRef}>
      {/* Narration text - positioned for mobile */}
      {showNarration && (
        <group position={[0, -6, -8]} rotation={[0, 0, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[16, 4]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.8} />
          </mesh>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.4}
            maxWidth={14}
            lineHeight={1.2}
            textAlign="center"
            color="#ffffff"
          >
            {narrationText}
          </Text>
        </group>
      )}
      
      {/* Mobile-optimized tour controls */}
      <group position={[0, -8, -8]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[10, 1.2]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} />
        </mesh>
        
        {/* Previous button */}
        <group position={[-3, 0, 0.1]} onClick={() => currentStopIndex > 0 && setCurrentStopIndex(prev => prev - 1)}>
          <mesh>
            <planeGeometry args={[2, 1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <Text position={[0, 0, 0.1]} fontSize={0.35} color="#ffffff">
            Prev
          </Text>
        </group>
        
        {/* Play/Pause button */}
        <group position={[0, 0, 0.1]} onClick={() => setIsPlaying(!isPlaying)}>
          <mesh>
            <planeGeometry args={[2, 1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <Text position={[0, 0, 0.1]} fontSize={0.35} color="#ffffff">
            {isPlaying ? "Pause" : "Play"}
          </Text>
        </group>
        
        {/* Next/Exit button */}
        <group 
          position={[3, 0, 0.1]} 
          onClick={() => {
            if (currentStopIndex < tourStops.length - 1) {
              setCurrentStopIndex(prev => prev + 1)
            } else {
              finishTour()
            }
          }}
        >
          <mesh>
            <planeGeometry args={[2, 1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <Text position={[0, 0, 0.1]} fontSize={0.35} color="#ffffff">
            {currentStopIndex < tourStops.length - 1 ? "Next" : "Exit"}
          </Text>
        </group>
      </group>
    </group>
  )
} 