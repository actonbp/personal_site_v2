"use client"

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import SimplexNoise from 'simplex-noise'

// Enhanced particle properties
interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  size: number
  color: THREE.Color
  alpha: number
  phase: number
  noiseOffset: THREE.Vector2
  originalPosition: THREE.Vector3
  trail: THREE.Vector3[]
}

// Flow field parameters
const noiseScale = 0.05
const noiseSpeed = 0.2
const flowForce = 0.015
const mouseInfluence = 0.03
const trailLength = 5

export default function InteractiveBackground() {
  const { viewport, mouse, clock } = useThree()
  const pointsRef = useRef<THREE.Points>(null!)
  const trailsRef = useRef<THREE.LineSegments>(null!)
  
  // Track mouse position for interaction
  const mousePosition = useRef(new THREE.Vector3())
  const targetMousePosition = useRef(new THREE.Vector3())
  const noiseTime = useRef(0)
  
  // Generate noise for flow field
  const simplex = useMemo(() => new SimplexNoise(), [])
  
  // Load particle texture
  const particleTexture = useTexture('/particle.png')
  
  // Create particles with improved distribution and properties
  const particles = useMemo<Particle[]>(() => {
    const temp = []
    const count = 800 // Significantly more particles for better effect
    
    for (let i = 0; i < count; i++) {
      // Use spherical distribution for more uniform coverage
      const phi = Math.random() * Math.PI * 2 // Full 360° horizontal
      const theta = Math.acos(2 * Math.random() - 1) // Better spherical distribution
      
      // Use a larger radius with variation for depth
      const radius = 15 + Math.random() * 25
      
      // Convert spherical to cartesian coordinates
      const x = radius * Math.sin(theta) * Math.cos(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(theta) - 20 // Offset to center around camera
      
      const position = new THREE.Vector3(x, y, z)
      
      // Enhanced color palette with more variation
      // Use a wider hue range with occasional accent colors
      let hue, saturation, lightness
      
      if (Math.random() > 0.9) {
        // Accent particles (10%)
        hue = Math.random() > 0.5 ? 0.9 : 0.1 // Red or cyan accents
        saturation = 0.7 + Math.random() * 0.3
        lightness = 0.6 + Math.random() * 0.3
      } else {
        // Main color scheme (blue to purple)
        hue = 0.6 + Math.random() * 0.25 // Slightly wider blue-purple range
        saturation = 0.3 + Math.random() * 0.6
        lightness = 0.4 + Math.random() * 0.4
      }
      
      const color = new THREE.Color().setHSL(hue, saturation, lightness)
      
      // Initialize trail points
      const trail: THREE.Vector3[] = []
      for (let j = 0; j < trailLength; j++) {
        trail.push(position.clone())
      }
      
      temp.push({
        position,
        originalPosition: position.clone(), // Store original position for reset or orbiting
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        acceleration: new THREE.Vector3(0, 0, 0),
        size: 0.5 + Math.random() * 2.5, // More varied sizes
        color,
        alpha: 0.2 + Math.random() * 0.7, // More varied opacity
        phase: Math.random() * Math.PI * 2, // Random phase for oscillation
        noiseOffset: new THREE.Vector2(Math.random() * 100, Math.random() * 100), // For flow field variation
        trail
      })
    }
    return temp
  }, [])
  
  // Create geometry for particles
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    
    // Create position, color, and size attributes
    const positions = new Float32Array(particles.length * 3)
    const colors = new Float32Array(particles.length * 4) // RGBA
    const sizes = new Float32Array(particles.length)
    
    particles.forEach((particle, i) => {
      positions[i * 3] = particle.position.x
      positions[i * 3 + 1] = particle.position.y
      positions[i * 3 + 2] = particle.position.z
      
      colors[i * 4] = particle.color.r
      colors[i * 4 + 1] = particle.color.g
      colors[i * 4 + 2] = particle.color.b
      colors[i * 4 + 3] = particle.alpha
      
      sizes[i] = particle.size
    })
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  }, [particles])
  
  // Create geometry for particle trails
  const trailGeometry = useMemo(() => {
    const lineCount = particles.length
    const pointsPerLine = trailLength
    
    // Create positions and colors for all line segments
    const positions = new Float32Array(lineCount * pointsPerLine * 3)
    const colors = new Float32Array(lineCount * pointsPerLine * 3)
    
    particles.forEach((particle, i) => {
      for (let j = 0; j < pointsPerLine; j++) {
        const index = (i * pointsPerLine + j) * 3
        
        // Initial positions (will be updated in animation loop)
        positions[index] = particle.position.x
        positions[index + 1] = particle.position.y
        positions[index + 2] = particle.position.z
        
        // Gradient colors from particle color to transparent
        const alpha = 1.0 - j / pointsPerLine // Fade out along the trail
        colors[index] = particle.color.r
        colors[index + 1] = particle.color.g
        colors[index + 2] = particle.color.b
      }
    })
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    return geometry
  }, [particles])
  
  // Create enhanced material with bloom effect
  const material = useMemo(() => {
    // Custom shader material with improved glow and bloom
    return new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: particleTexture },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec4 color;
        varying vec4 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          
          // Add subtle pulsing effect based on time and variation
          float pulse = sin(time * 0.5 + color.r * 10.0) * 0.1 + 0.9;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        uniform float time;
        varying vec4 vColor;
        
        void main() {
          // Apply soft-edge particle texture
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          
          // Enhanced bloom effect
          float dist = length(gl_PointCoord - vec2(0.5));
          float glow = 0.3 * (1.0 - min(dist * 2.0, 1.0));
          
          // Combine texture, color and glow
          gl_FragColor = vColor * texColor;
          gl_FragColor.rgb += vColor.rgb * glow;
          
          // Discard transparent pixels
          if (gl_FragColor.a < 0.05) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [particleTexture])
  
  // Create trail material with fade effect
  const trailMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          // Calculate alpha based on vertex position in line
          vAlpha = 0.8; // Will be calculated in animation loop
          
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
  
  // Update mouse position with smoother tracking
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convert mouse position to normalized device coordinates (-1 to +1)
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      
      // Set target mouse position with greater range of influence
      targetMousePosition.current.set(x * 15, y * 8, 0)
    }
    
    // Add touch support for mobile
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0]
        const x = (touch.clientX / window.innerWidth) * 2 - 1
        const y = -(touch.clientY / window.innerHeight) * 2 + 1
        
        targetMousePosition.current.set(x * 15, y * 8, 0)
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])
  
  // Enhanced animation loop with flow field
  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    // Update time uniform for shader animations
    if (material.uniforms) {
      material.uniforms.time.value = state.clock.elapsedTime
    }
    if (trailMaterial.uniforms) {
      trailMaterial.uniforms.time.value = state.clock.elapsedTime
    }
    
    // Increment noise time for flow field
    noiseTime.current += delta * noiseSpeed
    
    // Smooth mouse movement with exponential easing
    mousePosition.current.lerp(targetMousePosition.current, 0.08)
    
    // Get position and color attributes
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array
    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array
    
    // Update trail positions if trail geometry exists
    const trailPositions = trailsRef.current ? 
      trailsRef.current.geometry.attributes.position.array as Float32Array : null
    
    // Update particles with flow field and improved behaviors
    particles.forEach((particle, i) => {
      // Reset acceleration
      particle.acceleration.set(0, 0, 0)
      
      // Get flow field direction from simplex noise
      const noiseX = simplex.noise3D(
        particle.position.x * noiseScale + particle.noiseOffset.x,
        particle.position.y * noiseScale + particle.noiseOffset.y,
        noiseTime.current
      )
      
      const noiseY = simplex.noise3D(
        particle.position.x * noiseScale + particle.noiseOffset.x + 100,
        particle.position.y * noiseScale + particle.noiseOffset.y + 100,
        noiseTime.current
      )
      
      const noiseZ = simplex.noise3D(
        particle.position.x * noiseScale + particle.noiseOffset.x + 200,
        particle.position.y * noiseScale + particle.noiseOffset.y + 200,
        noiseTime.current
      )
      
      // Apply flow field force
      const flowDirection = new THREE.Vector3(noiseX, noiseY, noiseZ).normalize().multiplyScalar(flowForce)
      particle.acceleration.add(flowDirection)
      
      // Calculate direction to mouse with improved distance falloff
      const toMouse = new THREE.Vector3(
        mousePosition.current.x - particle.position.x,
        mousePosition.current.y - particle.position.y,
        5 - particle.position.z // Adjust Z component to create depth effect
      )
      
      // Non-linear distance-based influence for more natural attraction
      const distance = toMouse.length()
      const falloff = Math.pow(Math.max(0, 1 - distance / 20), 2) // Quadratic falloff
      
      if (distance > 0.1) { // Avoid division by zero and erratic behavior up close
        toMouse.normalize().multiplyScalar(falloff * mouseInfluence)
        particle.acceleration.add(toMouse)
      }
      
      // Add subtle attraction to original position for stability
      const toOrigin = new THREE.Vector3().subVectors(particle.originalPosition, particle.position)
      const originDistance = toOrigin.length()
      const originFalloff = Math.min(1, originDistance / 30) // Only pull back when far from origin
      
      toOrigin.normalize().multiplyScalar(originFalloff * 0.005)
      particle.acceleration.add(toOrigin)
      
      // Apply acceleration to velocity
      particle.velocity.add(particle.acceleration)
      
      // Add subtle turbulence based on particle properties
      const turbulence = 0.002 * (1 + Math.sin(state.clock.elapsedTime + particle.phase))
      particle.velocity.x += (Math.random() - 0.5) * turbulence
      particle.velocity.y += (Math.random() - 0.5) * turbulence
      particle.velocity.z += (Math.random() - 0.5) * turbulence
      
      // Apply non-linear damping for stability (stronger damping for faster particles)
      const speed = particle.velocity.length()
      const dampingFactor = 0.98 - Math.min(0.05, speed * 0.01)
      particle.velocity.multiplyScalar(dampingFactor)
      
      // Limit maximum velocity
      if (speed > 0.5) {
        particle.velocity.normalize().multiplyScalar(0.5)
      }
      
      // Update trail before moving the particle
      if (trailPositions) {
        // Shift trail points
        for (let j = trailLength - 1; j > 0; j--) {
          particle.trail[j].copy(particle.trail[j - 1])
        }
        // Set first trail point to current position
        particle.trail[0].copy(particle.position)
        
        // Update trail in geometry
        for (let j = 0; j < trailLength; j++) {
          const index = (i * trailLength + j) * 3
          trailPositions[index] = particle.trail[j].x
          trailPositions[index + 1] = particle.trail[j].y
          trailPositions[index + 2] = particle.trail[j].z
        }
      }
      
      // Apply velocity to position
      particle.position.add(particle.velocity)
      
      // Apply enhanced boundary constraints with soft rebounding
      const bounds = 40
      if (Math.abs(particle.position.x) > bounds) {
        // Soft rebound with damping
        particle.velocity.x *= -0.7
        particle.position.x = Math.sign(particle.position.x) * (bounds - 0.5)
      }
      
      if (Math.abs(particle.position.y) > bounds / 1.5) {
        particle.velocity.y *= -0.7
        particle.position.y = Math.sign(particle.position.y) * (bounds / 1.5 - 0.5)
      }
      
      // Z-bounds with depth layering
      if (particle.position.z > -5 || particle.position.z < -50) {
        particle.velocity.z *= -0.7
        particle.position.z = particle.position.z > -5 ? -5.5 : -49.5
      }
      
      // Update position in buffer
      positions[i * 3] = particle.position.x
      positions[i * 3 + 1] = particle.position.y
      positions[i * 3 + 2] = particle.position.z
      
      // Update alpha based on depth for parallax effect
      const depthFactor = Math.max(0, Math.min(1, (particle.position.z + 50) / 45))
      colors[i * 4 + 3] = particle.alpha * (0.2 + 0.8 * depthFactor)
      
      // Update size with subtle pulsing
      const pulseFactor = 0.9 + 0.1 * Math.sin(state.clock.elapsedTime * 0.5 + particle.phase)
      sizes[i] = particle.size * pulseFactor
    })
    
    // Add subtle rotation to the particle system for more dynamic feel
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03
      pointsRef.current.rotation.x += delta * 0.01
      pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.02
    }
    
    // Mark attributes for update
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.color.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true
    
    // Update trail geometry if it exists
    if (trailsRef.current && trailPositions) {
      trailsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <group>
      {/* Main particles */}
      <points ref={pointsRef} geometry={geometry} material={material} />
      
      {/* Particle trails */}
      <lineSegments ref={trailsRef} geometry={trailGeometry}>
        <primitive object={trailMaterial} attach="material" />
      </lineSegments>
    </group>
  )
} 