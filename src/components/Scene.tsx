"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Points, PointMaterial, Text, Line, useTexture } from "@react-three/drei"
import * as THREE from "three"
import { papers, topics } from "@/data/embeddingData"
import GuidedTour from "./GuidedTour"
import TourButton from "./TourButton"
import { gsap } from "gsap"

// Enhanced background particle settings
const particleCount = 2000
const particleSize = 0.08

// Post-processing effect strength
const bloomStrength = 0.8
const chromaticAberrationOffset = 0.002

export default function Scene() {
  const [hoveredPaper, setHoveredPaper] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [isTourActive, setIsTourActive] = useState(false)
  
  // Refs for animations
  const pointsRef = useRef<THREE.Points>(null!)
  const topicsGroupRef = useRef<THREE.Group>(null!)
  const papersGroupRef = useRef<THREE.Group>(null!)
  const connectionsRef = useRef<THREE.Group>(null!)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  
  // Particle trail refs
  const particleTrailsRef = useRef<THREE.Points>(null!)
  const trailTick = useRef(0)
  
  const { gl, scene, camera } = useThree()
  
  // Load particle texture
  const particleTexture = useTexture('/particle.png')
  
  // Create background particles with improved distribution
  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 4) // RGBA
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    
    // Create particles with improved distribution
    for (let i = 0; i < particleCount; i++) {
      // Use spherical distribution for more uniform coverage
      const theta = Math.random() * Math.PI * 2 // around
      const phi = Math.acos(2 * Math.random() - 1) // up/down
      const radius = 20 + Math.random() * 20 // varied distance
      
      // Convert to cartesian coordinates
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi) - 10 // Offset for better depth
      
      // Random velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.05
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05
      
      // Color with blue/purple base but more variation
      const hue = 0.6 + Math.random() * 0.2 // 0.6-0.8 (blue to purple)
      const saturation = 0.5 + Math.random() * 0.5
      const lightness = 0.5 + Math.random() * 0.4
      
      const color = new THREE.Color().setHSL(hue, saturation, lightness)
      colors[i * 4] = color.r
      colors[i * 4 + 1] = color.g
      colors[i * 4 + 2] = color.b
      colors[i * 4 + 3] = 0.2 + Math.random() * 0.6 // Varied opacity
      
      // Varied sizes for depth perception
      sizes[i] = particleSize * (0.5 + Math.random() * 1.5)
    }
    
    return { positions, colors, sizes, velocities }
  }, [])
  
  // Create particle geometry with attributes
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 4))
    geometry.setAttribute('size', new THREE.BufferAttribute(particleData.sizes, 1))
    return geometry
  }, [particleData])
  
  // Custom shader material for particles
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: particleTexture },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec4 color;
        varying vec4 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec4 vColor;
        
        void main() {
          gl_FragColor = vColor * texture2D(pointTexture, gl_PointCoord);
          if (gl_FragColor.a < 0.1) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [particleTexture])
  
  // Create particle trails for connections
  const trailsGeometry = useMemo(() => {
    const maxTrails = 1000 // Maximum number of trails
    const positions = new Float32Array(maxTrails * 3)
    const colors = new Float32Array(maxTrails * 4)
    const sizes = new Float32Array(maxTrails)
    
    // Initialize with zeros
    for (let i = 0; i < maxTrails; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      
      colors[i * 4] = 0
      colors[i * 4 + 1] = 0
      colors[i * 4 + 2] = 0
      colors[i * 4 + 3] = 0
      
      sizes[i] = 0
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  }, [])
  
  // Create trail material
  const trailMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: particleTexture }
      },
      vertexShader: `
        attribute float size;
        attribute vec4 color;
        varying vec4 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec4 vColor;
        
        void main() {
          gl_FragColor = vColor * texture2D(pointTexture, gl_PointCoord);
          if (gl_FragColor.a < 0.05) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [particleTexture])
  
  // Create dynamic connections with custom shader material
  const createConnectionMaterial = () => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float progress;
        uniform float time;
        varying vec3 vPosition;
        varying float vProgress;
        
        void main() {
          vPosition = position;
          vProgress = progress;
          
          // Animate based on progress and time
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vPosition;
        varying float vProgress;
        
        void main() {
          // Pulse effect
          float pulse = 0.5 + 0.5 * sin(time * 3.0 + vProgress * 10.0);
          
          // Gradient along the line
          float lineGradient = vProgress;
          
          // Combine pulse and gradient for glow effect
          float glow = pulse * (1.0 - lineGradient * 0.5);
          
          // Blue to purple gradient with pulse effect
          vec3 color1 = vec3(0.4, 0.2, 0.8); // Purple
          vec3 color2 = vec3(0.2, 0.4, 0.9); // Blue
          vec3 finalColor = mix(color1, color2, lineGradient) * glow;
          
          gl_FragColor = vec4(finalColor, 0.8 * pulse);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }
  
  // Create connections between papers and topics
  const connections = useMemo(() => {
    // Array to store line segment data
    const lineSegments: {
      points: THREE.Vector3[],
      color: string,
      intensity: number,
      width: number,
      dashSize?: number,
      gapSize?: number
    }[] = []
    
    // Create connections for selected or hovered topics
    const activeTopicId = selectedTopic || hoveredTopic
    if (activeTopicId) {
      const topic = topics.find(t => t.id === activeTopicId)
      if (topic) {
        const topicPos = new THREE.Vector3(...topic.embedding)
        
        // Connect to all related papers with enhanced styling
        topic.papers.forEach((paperId, index) => {
          const paper = papers.find(p => p.id === paperId)
          if (paper) {
            const paperPos = new THREE.Vector3(...paper.embedding)
            
            // Create a curved path between topic and paper
            const midPoint = new THREE.Vector3().addVectors(topicPos, paperPos).divideScalar(2)
            
            // Add some height to the midpoint for a curved effect
            // Alternate the curve direction for more visual interest
            const curveHeight = 1.5 + Math.random() * 1.5
            const curveDirection = index % 2 === 0 ? 1 : -1
            midPoint.y += curveHeight * curveDirection
            
            // Create bezier curve points
            const curve = new THREE.QuadraticBezierCurve3(
              topicPos,
              midPoint,
              paperPos
            )
            
            // Sample points along the curve
            const points = curve.getPoints(10)
            
            lineSegments.push({
              points,
              color: topic.color,
              intensity: selectedTopic ? 1.0 : 0.7, // Brighter for selected
              width: selectedTopic ? 2.5 : 1.5,
              dashSize: 0.5,
              gapSize: 0.3
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
        
        // Connect to all related topics with enhanced styling
        paper.topics.forEach((topicId, index) => {
          const topic = topics.find(t => t.id === topicId)
          if (topic) {
            // Only add if not already added
            if (!activeTopicId || activeTopicId !== topic.id) {
              const topicPos = new THREE.Vector3(...topic.embedding)
              
              // Create a curved path between paper and topic
              const midPoint = new THREE.Vector3().addVectors(paperPos, topicPos).divideScalar(2)
              
              // Alternate curve direction
              const curveHeight = 1.0 + Math.random() * 1.0
              const curveDirection = index % 2 === 0 ? 1 : -1
              midPoint.y += curveHeight * curveDirection
              
              // Create bezier curve points
              const curve = new THREE.QuadraticBezierCurve3(
                paperPos,
                midPoint,
                topicPos
              )
              
              // Sample points along the curve
              const points = curve.getPoints(10)
              
              lineSegments.push({
                points,
                color: topic.color,
                intensity: selectedPaper ? 1.0 : 0.7,
                width: selectedPaper ? 2.0 : 1.0
              })
            }
          }
        })
      }
    }
    
    return lineSegments
  }, [selectedTopic, hoveredTopic, selectedPaper, hoveredPaper])
  
  // GSAP animations for topic and paper focus
  useEffect(() => {
    // Kill any existing animations
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
    
    // Create new timeline
    timelineRef.current = gsap.timeline()
    
    // Animations for topics
    topics.forEach(topic => {
      const isActive = topic.id === selectedTopic || topic.id === hoveredTopic
      const meshes = scene.getObjectByProperty('userData', { topicId: topic.id })
      
      if (meshes) {
        // Scale animation
        const targetScale = isActive ? 1.5 : 1.0
        timelineRef.current?.to(meshes.scale, {
          x: targetScale,
          y: targetScale,
          z: targetScale,
          duration: 0.5,
          ease: "back.out(1.5)"
        })
        
        // Enhanced glow effect
        const materials = meshes.children.map(child => {
          // Check if child is a Mesh with a material property
          if ('material' in child) {
            return (child as THREE.Mesh).material;
          }
          return null;
        }).filter(material => material !== null);
        
        materials.forEach(material => {
          if (material) {
            timelineRef.current?.to(material, {
              emissiveIntensity: isActive ? 1.2 : 0.4,
              opacity: isActive ? 0.9 : 0.7,
              duration: 0.4,
              ease: "power2.out"
            })
          }
        })
      }
    })
    
    // Animations for papers
    papers.forEach(paper => {
      const isActive = paper.id === selectedPaper || paper.id === hoveredPaper
      const meshes = scene.getObjectByProperty('userData', { paperId: paper.id })
      
      if (meshes) {
        // Scale animation
        const targetScale = isActive ? 1.5 : 1.0
        timelineRef.current?.to(meshes.scale, {
          x: targetScale,
          y: targetScale,
          z: targetScale,
          duration: 0.5,
          ease: "back.out(1.5)"
        })
        
        // Enhanced glow effect
        const materials = meshes.children.map(child => {
          // Check if child is a Mesh with a material property
          if ('material' in child) {
            return (child as THREE.Mesh).material;
          }
          return null;
        }).filter(material => material !== null);
        
        materials.forEach(material => {
          if (material) {
            timelineRef.current?.to(material, {
              emissiveIntensity: isActive ? 1.2 : 0.3,
              opacity: isActive ? 0.9 : 0.7,
              duration: 0.4,
              ease: "power2.out"
            })
          }
        })
      }
    })
    
  }, [selectedTopic, hoveredTopic, selectedPaper, hoveredPaper, scene])
  
  // Animation loop with enhanced effects
  useFrame((state, delta) => {
    // Update particle material time uniform for animation
    if (particleMaterial.uniforms) {
      particleMaterial.uniforms.time.value += delta
    }
    
    // Update background particles with fluid motion
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      const colors = pointsRef.current.geometry.attributes.color.array as Float32Array
      const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const i4 = i * 4
        
        // Apply velocity with subtle variation
        positions[i3] += particleData.velocities[i3] * delta * 2
        positions[i3 + 1] += particleData.velocities[i3 + 1] * delta * 2
        positions[i3 + 2] += particleData.velocities[i3 + 2] * delta * 2
        
        // Boundary check and wrap around
        const bounds = 30
        if (Math.abs(positions[i3]) > bounds) {
          positions[i3] = -Math.sign(positions[i3]) * bounds
        }
        if (Math.abs(positions[i3 + 1]) > bounds) {
          positions[i3 + 1] = -Math.sign(positions[i3 + 1]) * bounds
        }
        if (Math.abs(positions[i3 + 2] + 10) > bounds) {
          positions[i3 + 2] = -Math.sign(positions[i3 + 2] + 10) * bounds - 10
        }
        
        // Subtle color pulsing
        const time = state.clock.elapsedTime
        const pulseFreq = 0.2 + (i % 10) * 0.02 // Varied frequencies
        const pulse = 0.85 + Math.sin(time * pulseFreq) * 0.15
        
        // Apply pulse to color brightness
        colors[i4 + 3] = (0.2 + Math.random() * 0.1) * pulse // Alpha pulsing
        
        // Size variation based on sine wave
        sizes[i] = particleData.sizes[i] * (0.9 + Math.sin(time * 0.3 + i) * 0.1)
      }
      
      // Gentle rotation for the entire particle system
      pointsRef.current.rotation.y += delta * 0.03
      pointsRef.current.rotation.x += delta * 0.01
      
      // Mark attributes for update
      pointsRef.current.geometry.attributes.position.needsUpdate = true
      pointsRef.current.geometry.attributes.color.needsUpdate = true
      pointsRef.current.geometry.attributes.size.needsUpdate = true
    }
    
    // Update connection particles (flowing along connections)
    if (particleTrailsRef.current && (selectedTopic || selectedPaper || hoveredTopic || hoveredPaper)) {
      const positions = particleTrailsRef.current.geometry.attributes.position.array as Float32Array
      const colors = particleTrailsRef.current.geometry.attributes.color.array as Float32Array
      const sizes = particleTrailsRef.current.geometry.attributes.size.array as Float32Array
      
      // Increment trail ticker
      trailTick.current += delta * 5
      
      // Add particles along connections
      let particleIndex = 0
      connections.forEach(connection => {
        // Get points along the connection
        const points = connection.points
        
        // Create multiple particles along each connection
        const numParticlesPerLine = 5
        for (let i = 0; i < numParticlesPerLine; i++) {
          if (particleIndex >= 1000) break // Stay within buffer limits
          
          // Calculate position along curve based on time
          const t = ((trailTick.current * 0.1) + (i / numParticlesPerLine)) % 1
          
          // Find points to interpolate between
          const segmentIndex = Math.floor(t * (points.length - 1))
          const segmentT = (t * (points.length - 1)) % 1
          
          let pos: THREE.Vector3
          
          if (segmentIndex < points.length - 1) {
            // Interpolate between points
            pos = new THREE.Vector3().lerpVectors(
              points[segmentIndex],
              points[segmentIndex + 1],
              segmentT
            )
          } else {
            pos = points[points.length - 1].clone()
          }
          
          // Set position
          positions[particleIndex * 3] = pos.x
          positions[particleIndex * 3 + 1] = pos.y
          positions[particleIndex * 3 + 2] = pos.z
          
          // Parse the connection color
          const color = new THREE.Color(connection.color)
          
          // Set color with slight variation
          colors[particleIndex * 4] = color.r * (0.9 + Math.random() * 0.2)
          colors[particleIndex * 4 + 1] = color.g * (0.9 + Math.random() * 0.2)
          colors[particleIndex * 4 + 2] = color.b * (0.9 + Math.random() * 0.2)
          colors[particleIndex * 4 + 3] = 0.7 + t * 0.3 // More visible at end of path
          
          // Set size (larger near end)
          sizes[particleIndex] = 0.2 + t * 0.3
          
          particleIndex++
        }
      })
      
      // Hide unused particles
      for (let i = particleIndex; i < 1000; i++) {
        colors[i * 4 + 3] = 0 // Set alpha to 0
      }
      
      // Mark attributes for update
      particleTrailsRef.current.geometry.attributes.position.needsUpdate = true
      particleTrailsRef.current.geometry.attributes.color.needsUpdate = true
      particleTrailsRef.current.geometry.attributes.size.needsUpdate = true
    }
    
    // Enhanced floating animation for topics
    if (topicsGroupRef.current) {
      // Multi-frequency oscillation for more organic movement
      const t = state.clock.elapsedTime
      topicsGroupRef.current.position.y = 
        Math.sin(t * 0.3) * 0.15 + 
        Math.sin(t * 0.5) * 0.1
      
      // Subtle rotation for added dimension
      topicsGroupRef.current.rotation.y = Math.sin(t * 0.15) * 0.03
    }
    
    // Advanced floating animation for papers
    if (papersGroupRef.current) {
      const t = state.clock.elapsedTime
      
      // Multi-axis floating for more organic movement
      papersGroupRef.current.position.y = Math.sin(t * 0.2) * 0.1
      papersGroupRef.current.position.x = Math.sin(t * 0.15) * 0.05
      
      papersGroupRef.current.rotation.y = Math.sin(t * 0.1) * 0.08
      papersGroupRef.current.rotation.x = Math.sin(t * 0.12) * 0.02
    }
    
    // Update connection line materials
    if (connectionsRef.current) {
      connectionsRef.current.children.forEach(child => {
        // Check if child has a material property
        if ('material' in child && child.material && 'uniforms' in (child.material as THREE.ShaderMaterial)) {
          (child.material as THREE.ShaderMaterial).uniforms.time.value = state.clock.elapsedTime
        }
      })
    }
  })
  
  // Handle tour activation with enhanced transitions
  const handleStartTour = () => {
    // Create animated transition to tour mode
    const timeline = gsap.timeline()
    
    // Smoothly reset any selected elements
    timeline.to(camera.position, {
      x: 0,
      y: 0,
      z: 15,
      duration: 1.2,
      ease: "power3.inOut",
      onComplete: () => {
        // Clear selections after camera moves
        setSelectedPaper(null)
        setSelectedTopic(null)
        
        // Activate the tour
        setIsTourActive(true)
      }
    })
    
    // Look at center
    timeline.to(camera.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1,
      ease: "power2.inOut"
    }, "<")
  }
  
  const handleTourComplete = () => {
    setIsTourActive(false)
  }
  
  const handleTourStop = () => {
    setIsTourActive(false)
  }
  
  return (
    <group position={[0, 0, -10]}>
      {/* Enhanced background particles with custom shader */}
      <points ref={pointsRef} geometry={particleGeometry} material={particleMaterial} />
      
      {/* Particle trails along connections */}
      <points ref={particleTrailsRef} geometry={trailsGeometry} material={trailMaterial} />
      
      {/* Topic nodes with enhanced effects */}
      <group ref={topicsGroupRef}>
        {topics.map(topic => {
          const isActive = topic.id === selectedTopic || topic.id === hoveredTopic
          const scale = isActive ? 1.3 : 1
          
          return (
            <group 
              key={topic.id} 
              position={topic.embedding}
              userData={{ topicId: topic.id }}
            >
              {/* Topic sphere with improved materials */}
              <mesh
                scale={[scale, scale, scale]}
                onClick={() => setSelectedTopic(topic.id === selectedTopic ? null : topic.id)}
                onPointerOver={() => setHoveredTopic(topic.id)}
                onPointerOut={() => setHoveredTopic(null)}
              >
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshPhysicalMaterial
                  color={topic.color}
                  emissive={topic.color}
                  emissiveIntensity={isActive ? 0.8 : 0.4}
                  transparent
                  opacity={0.9}
                  roughness={0.1}
                  metalness={0.8}
                  reflectivity={0.5}
                  clearcoat={0.5}
                  clearcoatRoughness={0.2}
                />
              </mesh>
              
              {/* Enhanced glow effect with multiple layers */}
              <mesh scale={[1.2 * scale, 1.2 * scale, 1.2 * scale]}>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshBasicMaterial
                  color={topic.color}
                  transparent
                  opacity={0.2}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Outer glow for more dramatic effect */}
              <mesh scale={[1.6 * scale, 1.6 * scale, 1.6 * scale]}>
                <sphereGeometry args={[0.6, 12, 12]} />
                <meshBasicMaterial
                  color={topic.color}
                  transparent
                  opacity={0.1}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Topic label with enhanced text */}
              {isActive && (
                <Text
                  position={[0, 1.0, 0]}
                  fontSize={0.35}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.03}
                  outlineColor="#000000"
                  fillOpacity={0.9}
                  outlineOpacity={0.8}
                >
                  {topic.name}
                </Text>
              )}
              
              {/* Paper count with improved styling */}
              {isActive && (
                <Text
                  position={[0, -1.0, 0]}
                  fontSize={0.28}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.02}
                  outlineColor="#000000"
                >
                  {topic.papers.length} papers
                </Text>
              )}
            </group>
          )
        })}
      </group>
      
      {/* Paper nodes with improved materials and effects */}
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
            <group 
              key={paper.id} 
              position={paper.embedding}
              userData={{ paperId: paper.id }}
            >
              {/* Paper sphere with improved material */}
              <mesh
                scale={[scale, scale, scale]}
                onClick={() => setSelectedPaper(paper.id === selectedPaper ? null : paper.id)}
                onPointerOver={() => setHoveredPaper(paper.id)}
                onPointerOut={() => setHoveredPaper(null)}
              >
                <sphereGeometry args={[0.3, 24, 24]} />
                <meshPhysicalMaterial
                  color="#ffffff"
                  emissive={paperColor}
                  emissiveIntensity={isActive ? 1.0 : 0.3}
                  roughness={0.1}
                  metalness={0.8}
                  reflectivity={0.7}
                  clearcoat={0.8}
                  clearcoatRoughness={0.1}
                />
              </mesh>
              
              {/* Subtle glow effect */}
              <mesh scale={[1.3 * scale, 1.3 * scale, 1.3 * scale]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial
                  color={paperColor}
                  transparent
                  opacity={0.15}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Paper label with improved text styling */}
              {isActive && (
                <group>
                  <Text
                    position={[0, 0.7, 0]}
                    fontSize={0.22}
                    maxWidth={3.5}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor="#000000"
                    textAlign="center"
                  >
                    {paper.title}
                  </Text>
                  
                  <Text
                    position={[0, -0.6, 0]}
                    fontSize={0.18}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#000000"
                  >
                    {paper.year} • {paper.citations} citations
                  </Text>
                </group>
              )}
            </group>
          )
        })}
      </group>
      
      {/* Enhanced connections with curved paths and animated particles */}
      <group ref={connectionsRef}>
        {connections.map((connection, i) => {
          // Create unique material instance for each line
          const lineMaterial = createConnectionMaterial()
          
          return (
            <group key={i}>
              <Line
                points={connection.points}
                color={connection.color}
                lineWidth={connection.width || 2}
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                dashed={connection.dashSize !== undefined}
                dashSize={connection.dashSize}
                gapSize={connection.gapSize}
              />
            </group>
          )
        })}
      </group>
      
      {/* Tour button with improved styling */}
      {!isTourActive && <TourButton onStartTour={handleStartTour} />}
      
      {/* Guided tour component */}
      <GuidedTour 
        isActive={isTourActive} 
        onComplete={handleTourComplete} 
        onStop={handleTourStop} 
      />
    </group>
  )
}

