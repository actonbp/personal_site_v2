"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text, Float } from "@react-three/drei"
import * as THREE from "three"
import { gsap } from "gsap"

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@&%*!?><[]{}".split("")
const numCharacters = 300 // Increased number of characters for more density

type MatrixRainProps = {
  focusedTopic: string | null
  topicPositions: { [key: string]: [number, number, number] }
}

interface ParticleData {
  x: number
  y: number
  z: number
  speed: number
  char: string
  targetX: number
  targetY: number
  targetZ: number
  color: THREE.Color
  size: number
  rotation: number
  trailLength: number
  delay: number
  phase: number
}

export default function MatrixRain({ focusedTopic, topicPositions }: MatrixRainProps) {
  const group = useRef<THREE.Group>(null!)
  const textRefs = useRef<THREE.Mesh[]>([])
  const linesRef = useRef<THREE.LineSegments>(null!)
  const particlesRef = useRef<THREE.Points>(null!)
  const trailsRef = useRef<THREE.Points>(null!)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const { gl } = useThree()

  // Get a random color in the blue-purple spectrum with wider variation
  const getRandomColor = () => {
    const hue = 0.6 + Math.random() * 0.2 // Blue to purple range (0.6-0.8)
    const saturation = 0.5 + Math.random() * 0.5 // Medium to high saturation
    const lightness = 0.5 + Math.random() * 0.4 // Medium to bright lightness
    
    return new THREE.Color().setHSL(hue, saturation, lightness)
  }

  // Convert a color to hex string format
  const colorToHex = (color: THREE.Color) => {
    return '#' + color.getHexString()
  }

  const initialPositions = useMemo(() => {
    return Array.from({ length: numCharacters }, (_, i) => ({
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 50 + 25,
      z: (Math.random() - 0.5) * 50,
      speed: Math.random() * 5 + 2,
      char: characters[Math.floor(Math.random() * characters.length)],
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      color: getRandomColor(),
      size: 0.5 + Math.random() * 0.8, // Varied sizes for more dynamic look
      rotation: Math.random() * Math.PI * 2, // Random rotation
      trailLength: 1 + Math.random() * 4, // Trail length behind particles
      delay: Math.random() * 1.5, // Staggered animation delay
      phase: Math.random() * Math.PI * 2 // For oscillation effects
    }))
  }, [])

  // Create network connections
  const connectionGeometry = useMemo(() => {
    const points: number[] = []
    const colors: number[] = []
    const widths: number[] = []
    const phases: number[] = []
    
    // Create more connections for a denser network
    for (let i = 0; i < numCharacters; i++) {
      for (let j = i + 1; j < numCharacters; j++) {
        if (Math.random() > 0.93) { // Increased connection count (7% chance instead of 5%)
          points.push(
            initialPositions[i].x, initialPositions[i].y, initialPositions[i].z,
            initialPositions[j].x, initialPositions[j].y, initialPositions[j].z
          )
          
          // Create more vibrant colors for connections
          const color1 = getRandomColor()
          const color2 = getRandomColor()
          
          colors.push(
            color1.r, color1.g, color1.b,
            color2.r, color2.g, color2.b
          )
          
          // Store line widths for animation
          widths.push(
            0.5 + Math.random() * 1.5,
            0.5 + Math.random() * 1.5
          )
          
          // Store phase offset for pulse animation
          phases.push(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          )
        }
      }
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('width', new THREE.Float32BufferAttribute(widths, 1))
    geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1))
    return geometry
  }, [initialPositions])

  // Create trail points geometry
  const trailGeometry = useMemo(() => {
    const positions = new Float32Array(numCharacters * 30 * 3) // Each character has up to 10 trail points
    const colors = new Float32Array(numCharacters * 30 * 4) // RGBA colors
    const sizes = new Float32Array(numCharacters * 30)
    
    // Initialize with zero values
    for (let i = 0; i < positions.length; i++) {
      positions[i] = 0
    }
    
    for (let i = 0; i < colors.length; i++) {
      colors[i] = 0
    }
    
    for (let i = 0; i < sizes.length; i++) {
      sizes[i] = 0
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geometry
  }, [])

  // Custom point material with glow effect for trails
  const trailMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: new THREE.TextureLoader().load('/particle.png') }
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
  }, [])

  // Custom line material with pulse animation
  const lineMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute vec3 color;
        attribute float width;
        attribute float phase;
        
        uniform float time;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          // Calculate pulsing effect
          float pulse = 0.5 + 0.5 * sin(time * 2.0 + phase);
          vAlpha = 0.2 + 0.6 * pulse;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          gl_FragColor = vec4(vColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })
  }, [])

  // Handle focus changes with GSAP
  useEffect(() => {
    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
    
    // Create new timeline
    timelineRef.current = gsap.timeline()
    
    if (focusedTopic) {
      // Staggered transition to network formation
      textRefs.current.forEach((mesh, i) => {
        if (mesh) {
          const topicPos = topicPositions[focusedTopic]
          const angle = (i / numCharacters) * Math.PI * 2
          const radius = 15 + Math.random() * 5 // Varied radius
          
          const targetX = topicPos[0] + Math.cos(angle) * radius
          const targetY = topicPos[1] + Math.sin(angle) * radius
          const targetZ = topicPos[2] + (Math.random() - 0.5) * 5 // Add some depth variation
          
          // Update target position
          initialPositions[i].targetX = targetX
          initialPositions[i].targetY = targetY
          initialPositions[i].targetZ = targetZ
          
          // Staggered animation with varied durations
          timelineRef.current?.to(
            mesh.position, 
            {
              x: targetX,
              y: targetY,
              z: targetZ,
              duration: 1.5 + Math.random() * 1.0,
              ease: "power3.inOut",
              delay: initialPositions[i].delay * 0.3
            },
            "<0.02" // Slight overlap for staggered effect
          )
          
          // Animate glow/size effect on focus
          if (mesh.children[0]) {
            const textGeometry = mesh.children[0] as THREE.Mesh
            if (textGeometry.material instanceof THREE.Material) {
              timelineRef.current?.to(
                textGeometry.material,
                {
                  opacity: 0.3 + Math.random() * 0.3,
                  duration: 1.0,
                  ease: "power2.inOut"
                },
                "<"
              )
            }
          }
        }
      })
      
      // Animate line opacity
      timelineRef.current.to(
        lineMaterial.uniforms,
        {
          "time.value": 10,
          duration: 5,
          ease: "none"
        },
        0
      )
    } else {
      // Reset timeline when unfocusing
      timelineRef.current.to(
        lineMaterial.uniforms,
        {
          "time.value": 0,
          duration: 1,
          ease: "power2.inOut"
        },
        0
      )
    }
    
  }, [focusedTopic, topicPositions, lineMaterial.uniforms])

  // Main animation loop
  useFrame((state, delta) => {
    // Update line material time uniform
    if (lineMaterial.uniforms) {
      lineMaterial.uniforms.time.value += delta
    }
    
    // Update particle trails
    if (trailsRef.current) {
      const positions = trailsRef.current.geometry.attributes.position.array as Float32Array
      const colors = trailsRef.current.geometry.attributes.color.array as Float32Array
      const sizes = trailsRef.current.geometry.attributes.size.array as Float32Array
      
      textRefs.current.forEach((mesh, i) => {
        if (mesh) {
          const trailBase = i * 30 * 3 // Each character has up to 30 trail points
          const colorBase = i * 30 * 4 // RGBA values
          const sizeBase = i * 30
          
          // Shift trail points
          for (let j = 9; j > 0; j--) {
            const currentIdx = trailBase + j * 3
            const prevIdx = trailBase + (j - 1) * 3
            const currentColorIdx = colorBase + j * 4
            const prevColorIdx = colorBase + (j - 1) * 4
            const currentSizeIdx = sizeBase + j
            const prevSizeIdx = sizeBase + (j - 1)
            
            // Copy position from previous point
            positions[currentIdx] = positions[prevIdx]
            positions[currentIdx + 1] = positions[prevIdx + 1]
            positions[currentIdx + 2] = positions[prevIdx + 2]
            
            // Copy color from previous point with fading
            colors[currentColorIdx] = colors[prevColorIdx] * 0.95
            colors[currentColorIdx + 1] = colors[prevColorIdx + 1] * 0.95
            colors[currentColorIdx + 2] = colors[prevColorIdx + 2] * 0.95
            colors[currentColorIdx + 3] = colors[prevColorIdx + 3] * 0.85 // Faster alpha fade
            
            // Shrink size along the trail
            sizes[currentSizeIdx] = sizes[prevSizeIdx] * 0.92
          }
          
          // Set the first trail point to current character position
          positions[trailBase] = mesh.position.x
          positions[trailBase + 1] = mesh.position.y
          positions[trailBase + 2] = mesh.position.z
          
          // Set color based on character color
          const charColor = initialPositions[i].color
          colors[colorBase] = charColor.r
          colors[colorBase + 1] = charColor.g
          colors[colorBase + 2] = charColor.b
          colors[colorBase + 3] = focusedTopic ? 0.7 : 0.5 // Higher opacity when focused
          
          // Set size for first trail point
          sizes[sizeBase] = initialPositions[i].size * (focusedTopic ? 1.5 : 1.0)
        }
      })
      
      // Mark attributes as needing update
      trailsRef.current.geometry.attributes.position.needsUpdate = true
      trailsRef.current.geometry.attributes.color.needsUpdate = true
      trailsRef.current.geometry.attributes.size.needsUpdate = true
    }
    
    textRefs.current.forEach((mesh, i) => {
      if (mesh) {
        if (focusedTopic) {
          // GSAP handles most of the animation, but we add some subtle movement here
          // Add subtle oscillation to create living network
          const time = state.clock.elapsedTime
          const phase = initialPositions[i].phase
          const oscX = Math.sin(time * 0.5 + phase) * 0.2
          const oscY = Math.cos(time * 0.3 + phase) * 0.2
          const oscZ = Math.sin(time * 0.4 + phase * 2) * 0.2
          
          mesh.position.x += oscX * delta
          mesh.position.y += oscY * delta
          mesh.position.z += oscZ * delta
          
          // Slow rotation when in network mode
          mesh.rotation.x += delta * 0.1
          mesh.rotation.y += delta * 0.2
        } else {
          // Normal matrix rain behavior with enhanced effects
          mesh.position.y -= initialPositions[i].speed * delta
          
          // Add subtle horizontal drift
          mesh.position.x += Math.sin(state.clock.elapsedTime * 0.5 + initialPositions[i].phase) * 0.02
          
          // Rotate characters as they fall
          mesh.rotation.x += delta * 2
          mesh.rotation.z += delta * 0.5
          
          if (mesh.position.y < -25) {
            mesh.position.y = 25
            mesh.position.x = (Math.random() - 0.5) * 50
            mesh.position.z = (Math.random() - 0.5) * 50
            
            // Assign a new color when recycling
            initialPositions[i].color = getRandomColor()
            initialPositions[i].phase = Math.random() * Math.PI * 2
            
            // Update the text color
            if (mesh.children[0]) {
              const textGeometry = mesh.children[0] as THREE.Mesh
              if (textGeometry.material instanceof THREE.Material) {
                (textGeometry.material as any).color = initialPositions[i].color
              }
            }
          }
        }

        // Add pulsing glow effect based on time
        if (mesh.children[0]) {
          const textGeometry = mesh.children[0] as THREE.Mesh
          if (textGeometry.material instanceof THREE.Material) {
            const pulseBase = focusedTopic ? 0.3 : 0.2
            const pulseAmplitude = focusedTopic ? 0.2 : 0.3
            const pulseFreq = focusedTopic ? 0.5 : 1.0
            
            textGeometry.material.opacity = 
              pulseBase + pulseAmplitude * Math.sin(state.clock.elapsedTime * pulseFreq + initialPositions[i].phase)
          }
        }
      }
    })

    // Update line positions if not focused (when focused, GSAP handles it)
    if (linesRef.current && !focusedTopic) {
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array
      
      // Update line positions based on character positions
      let lineIdx = 0
      for (let i = 0; i < numCharacters; i++) {
        for (let j = i + 1; j < numCharacters; j++) {
          if (Math.random() > 0.93) {
            const idx1 = i
            const idx2 = j
            
            if (textRefs.current[idx1] && textRefs.current[idx2]) {
              positions[lineIdx * 6] = textRefs.current[idx1].position.x
              positions[lineIdx * 6 + 1] = textRefs.current[idx1].position.y
              positions[lineIdx * 6 + 2] = textRefs.current[idx1].position.z
              
              positions[lineIdx * 6 + 3] = textRefs.current[idx2].position.x
              positions[lineIdx * 6 + 4] = textRefs.current[idx2].position.y
              positions[lineIdx * 6 + 5] = textRefs.current[idx2].position.z
              
              lineIdx++
            }
          }
        }
      }
      
      linesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      {/* Enhanced line connections with shader material */}
      <lineSegments ref={linesRef} geometry={connectionGeometry}>
        <primitive object={lineMaterial} attach="material" />
      </lineSegments>
      
      {/* Particle trails */}
      <points ref={trailsRef} geometry={trailGeometry} material={trailMaterial} />
      
      {/* Matrix characters */}
      {initialPositions.map((pos, i) => (
        <Float 
          key={i} 
          speed={focusedTopic ? 0.5 : 2} 
          rotationIntensity={focusedTopic ? 0.2 : 1}
          floatIntensity={focusedTopic ? 0.1 : 0.5}
        >
          <Text
            ref={(el) => {
              if (el) textRefs.current[i] = el
            }}
            position={[pos.x, pos.y, pos.z]}
            fontSize={pos.size}
            color={colorToHex(pos.color)}
            anchorX="center"
            anchorY="middle"
            material-transparent={true}
            material-opacity={Math.random() * 0.5 + 0.2}
            material-blending={THREE.AdditiveBlending}
            material-depthWrite={false}
          >
            {pos.char}
          </Text>
        </Float>
      ))}
    </group>
  )
} 