"use client"

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Particle properties
interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  size: number
  color: THREE.Color
  alpha: number
}

export default function InteractiveBackground() {
  const { viewport, mouse } = useThree()
  const pointsRef = useRef<THREE.Points>(null!)
  
  // Track mouse position for interaction
  const mousePosition = useRef(new THREE.Vector3())
  const targetMousePosition = useRef(new THREE.Vector3())
  
  // Create particles
  const particles = useMemo<Particle[]>(() => {
    const temp = []
    const count = 500 // Increased number of particles
    
    for (let i = 0; i < count; i++) {
      // Create particles in a spherical distribution around the camera
      const phi = Math.random() * Math.PI * 2 // Full 360° horizontal
      const theta = Math.random() * Math.PI // Full 180° vertical
      
      // Use a larger radius to create a more immersive environment
      const radius = 15 + Math.random() * 25
      
      // Convert spherical to cartesian coordinates
      const x = radius * Math.sin(theta) * Math.cos(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(theta) - 20 // Offset to center around camera
      
      // Add more particles to the sides (left/right)
      let position
      if (i < count * 0.6) { // 60% of particles in spherical distribution
        position = new THREE.Vector3(x, y, z)
      } else { // 40% of particles specifically on the sides
        const side = Math.random() > 0.5 ? 1 : -1
        position = new THREE.Vector3(
          side * (15 + Math.random() * 10), // Place on left or right side
          (Math.random() - 0.5) * 20,       // Random height
          (Math.random() - 0.5) * 20 - 20   // Random depth
        )
      }
      
      // Random soft colors (blues and purples)
      const hue = 0.6 + Math.random() * 0.2 // Blue to purple range
      const saturation = 0.3 + Math.random() * 0.5
      const lightness = 0.5 + Math.random() * 0.3
      
      const color = new THREE.Color().setHSL(hue, saturation, lightness)
      
      temp.push({
        position,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        acceleration: new THREE.Vector3(0, 0, 0),
        size: 0.5 + Math.random() * 2.0, // Varied sizes
        color,
        alpha: 0.2 + Math.random() * 0.6 // More varied opacity
      })
    }
    return temp
  }, [])
  
  // Create geometry
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
  
  // Create material
  const material = useMemo(() => {
    // Custom shader material for better-looking particles
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
          if (gl_FragColor.a < 0.1) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [])
  
  // Update mouse position
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convert mouse position to normalized device coordinates (-1 to +1)
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      
      // Set target mouse position
      targetMousePosition.current.set(x * 10, y * 5, 0)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // Animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    // Smooth mouse movement
    mousePosition.current.lerp(targetMousePosition.current, 0.05)
    
    // Get position and color attributes
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    // Update particles
    particles.forEach((particle, i) => {
      // Calculate direction to mouse with distance falloff
      const direction = new THREE.Vector3(
        mousePosition.current.x - particle.position.x,
        mousePosition.current.y - particle.position.y,
        -particle.position.z
      )
      
      // Distance-based influence
      const distance = direction.length()
      const influence = Math.max(0, 1 - distance / 15) * 0.01
      
      direction.normalize().multiplyScalar(influence)
      
      // Apply subtle mouse attraction
      particle.acceleration.copy(direction)
      
      // Apply acceleration to velocity
      particle.velocity.add(particle.acceleration)
      
      // Add some random movement
      particle.velocity.x += (Math.random() - 0.5) * 0.002
      particle.velocity.y += (Math.random() - 0.5) * 0.002
      particle.velocity.z += (Math.random() - 0.5) * 0.002
      
      // Dampen velocity for stability
      particle.velocity.multiplyScalar(0.98)
      
      // Apply velocity to position
      particle.position.add(particle.velocity)
      
      // Contain particles within bounds - use a larger boundary
      const bounds = 30
      if (Math.abs(particle.position.x) > bounds) {
        particle.velocity.x *= -0.5
        particle.position.x = Math.sign(particle.position.x) * bounds
      }
      
      if (Math.abs(particle.position.y) > bounds / 2) {
        particle.velocity.y *= -0.5
        particle.position.y = Math.sign(particle.position.y) * (bounds / 2)
      }
      
      if (particle.position.z > -10 || particle.position.z < -40) {
        particle.velocity.z *= -0.5
        particle.position.z = particle.position.z > -10 ? -10 : -40
      }
      
      // Update position in buffer
      positions[i * 3] = particle.position.x
      positions[i * 3 + 1] = particle.position.y
      positions[i * 3 + 2] = particle.position.z
    })
    
    // Rotate the entire particle system slightly for more dynamic feel
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02
    }
    
    // Mark attributes for update
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  )
} 