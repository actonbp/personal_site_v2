"use client"

import { useRef, useState, useEffect } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { Text, Html } from "@react-three/drei"
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
  onReachStop?: () => void
}

interface GuidedTourProps {
  isActive: boolean
  onComplete: () => void
  onStop: () => void
  setActiveTopic?: (topic: string | null) => void
}

export default function GuidedTour({ isActive, onComplete, onStop, setActiveTopic }: GuidedTourProps) {
  const { camera, scene } = useThree()
  const [currentStopIndex, setCurrentStopIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showNarration, setShowNarration] = useState(false)
  const [narrationText, setNarrationText] = useState("")
  const [activeTopic, setActiveTopicInternal] = useState<string | null>(null)
  const [activePaper, setActivePaper] = useState<string | null>(null)
  const tourRef = useRef<THREE.Group>(null!)
  const originalCameraPosition = useRef(new THREE.Vector3())
  const originalCameraRotation = useRef(new THREE.Euler())
  const timeline = useRef<gsap.core.Timeline | null>(null)
  
  // Update the parent component's state when our internal state changes
  useEffect(() => {
    if (setActiveTopic) {
      setActiveTopic(activeTopic);
    }
  }, [activeTopic, setActiveTopic]);
  
  // Helper function to set the active topic both internally and externally
  const updateActiveTopic = (topic: string | null) => {
    setActiveTopicInternal(topic);
    // The parent will be updated via the useEffect above
  }
  
  // Find topic elements in the scene
  const findTopicElement = (topicName: string) => {
    let topicElement = null;
    scene.traverse((object) => {
      if (object.userData && object.userData.type === 'topic' && object.userData.name === topicName) {
        topicElement = object;
      }
    });
    return topicElement;
  }
  
  // Find paper elements in the scene
  const findPaperElement = (paperTitle: string) => {
    let paperElement = null;
    scene.traverse((object) => {
      if (object.userData && object.userData.type === 'paper' && object.userData.title === paperTitle) {
        paperElement = object;
      }
    });
    return paperElement;
  }
  
  // Generate tour stops dynamically based on topics and papers
  const generateTourStops = () => {
    const stops: TourStop[] = [
      {
        title: "Welcome to My Research",
        description: "Let's explore the key areas of my work",
        target: {
          position: new THREE.Vector3(0, 0, 20),
          lookAt: new THREE.Vector3(0, 0, 0)
        },
        duration: 5,
        entities: [],
        narration: "Welcome to an interactive journey through my research. I'll guide you through the main topics and key papers that define my work.",
        onReachStop: () => {
          // Reset any active topics when starting the tour
          updateActiveTopic(null);
          setActivePaper(null);
        }
      }
    ];
    
    // Add stops for each topic
    topics.forEach(topic => {
      // Add a stop for the topic itself
      stops.push({
        title: topic.name,
        description: `Exploring ${topic.name}`,
        target: {
          position: new THREE.Vector3(...topic.embedding).add(new THREE.Vector3(5, 0, 5)),
          lookAt: new THREE.Vector3(...topic.embedding)
        },
        duration: 8,
        entities: [
          { type: "topic", id: topic.id, highlight: true }
        ],
        narration: `My work on ${topic.name.toLowerCase()} focuses on understanding complex systems and their interactions.`,
        onReachStop: () => {
          // Activate this topic when we reach this stop
          updateActiveTopic(topic.name);
          setActivePaper(null);
        }
      });
      
      // Find papers related to this topic
      const relatedPapers = papers.filter(paper => paper.topics.includes(topic.id));
      
      // Add stops for each related paper
      relatedPapers.forEach(paper => {
        stops.push({
          title: paper.title,
          description: "Exploring this research paper",
          target: {
            position: new THREE.Vector3(...paper.embedding).add(new THREE.Vector3(3, 0, 3)),
            lookAt: new THREE.Vector3(...paper.embedding)
          },
          duration: 6,
          entities: [
            { type: "topic", id: topic.id, highlight: true },
            { type: "paper", id: paper.id, highlight: true }
          ],
          narration: paper.abstract,
          onReachStop: () => {
            // Keep the topic active and also activate this paper
            updateActiveTopic(topic.name);
            setActivePaper(paper.title);
          }
        });
      });
    });
    
    // Add a final connecting-the-dots stop
    stops.push({
      title: "Connecting the Dots",
      description: "How these research areas interconnect",
      target: {
        position: new THREE.Vector3(0, 5, 15),
        lookAt: new THREE.Vector3(0, 0, 0)
      },
      duration: 10,
      entities: [],
      narration: "The most exciting aspects of my research emerge at the intersections of these fields. By connecting these diverse topics, we can develop new approaches to understanding complex systems.",
      onReachStop: () => {
        // Reset active elements for the final overview
        updateActiveTopic(null);
        setActivePaper(null);
      }
    });
    
    return stops;
  };
  
  // Create tour stops dynamically
  const tourStops = useRef<TourStop[]>(generateTourStops()).current;
  
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
    
    // Call the onReachStop callback if it exists
    if (currentStop.onReachStop) {
      currentStop.onReachStop();
    }
    
    // Add a small delay to allow the topic/paper activation to take effect
    timeline.current.to({}, { duration: 0.5 });
    
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
    
    // Add a pause at the end of each stop
    timeline.current.to({}, { duration: currentStop.duration - 2 })
  }
  
  // Reset the tour
  const resetTour = () => {
    // Kill any existing animations
    if (timeline.current) {
      timeline.current.kill()
    }
    
    // Reset camera to original position
    gsap.to(camera.position, {
      x: originalCameraPosition.current.x,
      y: originalCameraPosition.current.y,
      z: originalCameraPosition.current.z,
      duration: 1,
      ease: "power2.inOut"
    })
    
    // Reset camera rotation
    gsap.to(camera.rotation, {
      x: originalCameraRotation.current.x,
      y: originalCameraRotation.current.y,
      z: originalCameraRotation.current.z,
      duration: 1,
      ease: "power2.inOut"
    })
    
    // Reset state
    setCurrentStopIndex(-1)
    setIsPlaying(false)
    setShowNarration(false)
    setNarrationText("")
    updateActiveTopic(null)
    setActivePaper(null)
  }
  
  // Finish the tour
  const finishTour = () => {
    resetTour()
    onComplete()
  }
  
  // Pause the tour
  const handlePause = () => {
    setIsPlaying(false)
    if (timeline.current) {
      timeline.current.pause()
    }
  }
  
  // Resume the tour
  const handlePlay = () => {
    setIsPlaying(true)
    if (timeline.current) {
      timeline.current.play()
    }
  }
  
  // Stop the tour
  const handleStop = () => {
    resetTour()
    onStop()
  }
  
  // Go to next stop
  const handleNext = () => {
    if (currentStopIndex < tourStops.length - 1) {
      setCurrentStopIndex(prev => prev + 1)
    } else {
      finishTour()
    }
  }
  
  // Go to previous stop
  const handlePrevious = () => {
    if (currentStopIndex > 0) {
      setCurrentStopIndex(prev => prev - 1)
    }
  }
  
  // Use useFrame to update any elements that need to be animated
  useFrame((state, delta) => {
    // You can add additional animations here if needed
  })
  
  // Render the tour UI
  return (
    <group ref={tourRef}>
      {/* Tour controls and narration */}
      <Html position={[0, 0, 0]} center>
        {showNarration && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-4/5 max-w-2xl bg-black bg-opacity-80 text-white p-6 rounded-lg shadow-lg z-50">
            <h2 className="text-xl font-bold mb-2">{tourStops[currentStopIndex]?.title}</h2>
            <p className="text-lg">{narrationText}</p>
            <div className="mt-4 text-sm text-gray-300">
              Stop {currentStopIndex + 1} of {tourStops.length}
            </div>
          </div>
        )}
        
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-70 px-6 py-3 rounded-full shadow-lg z-50">
          {/* Previous button */}
          <button 
            onClick={handlePrevious}
            disabled={currentStopIndex <= 0}
            className={`p-2 rounded-full ${currentStopIndex <= 0 ? 'text-gray-500' : 'text-white hover:bg-gray-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Play/Pause button */}
          {isPlaying ? (
            <button 
              onClick={handlePause}
              className="p-2 rounded-full text-white hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={handlePlay}
              className="p-2 rounded-full text-white hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          {/* Stop button */}
          <button 
            onClick={handleStop}
            className="p-2 rounded-full text-white hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
          
          {/* Next/Exit button */}
          {currentStopIndex < tourStops.length - 1 ? (
            <button 
              onClick={handleNext}
              className="p-2 rounded-full text-white hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={finishTour}
              className="p-2 rounded-full text-white hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </Html>
    </group>
  )
} 