"use client"

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface PaperGraphicProps {
  title: string
  position: [number, number, number]
  isVisible: boolean
  onClick?: () => void
}

export default function PaperGraphic({ title, position, isVisible, onClick }: PaperGraphicProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  
  // Create paper shape with lighter color
  const paperGeometry = new THREE.PlaneGeometry(3, 4) // Larger size
  const paperMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff', // Pure white for better visibility
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  })

  // Create glow effect with stronger intensity
  const glowGeometry = new THREE.PlaneGeometry(3.4, 4.4)
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color('#00ff00') },
      hover: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float hover;
      uniform vec3 color;
      varying vec2 vUv;
      
      void main() {
        float alpha = 0.6 * (1.0 + sin(time * 2.0));
        float edge = 1.0 - smoothstep(0.3, 0.5, distance(vUv, vec2(0.5)));
        // Add hover effect
        float hoverGlow = hover * 0.3;
        gl_FragColor = vec4(color, (alpha * edge * 0.4) + hoverGlow);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  })

  useFrame((state) => {
    if (isVisible && glowRef.current) {
      const material = glowRef.current.material as THREE.ShaderMaterial
      material.uniforms.time.value = state.clock.elapsedTime
      material.uniforms.hover.value = hovered ? 1 : 0
      
      // More dynamic floating animation
      const floatY = Math.sin(state.clock.elapsedTime + position[0]) * 0.2
      const floatX = Math.cos(state.clock.elapsedTime + position[2]) * 0.1
      
      groupRef.current.position.y = position[1] + floatY
      groupRef.current.position.x = position[0] + floatX
      
      // Smooth rotation
      const targetRotation = hovered ? 0.2 : Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      groupRef.current.rotation.z += (targetRotation - groupRef.current.rotation.z) * 0.1
      
      // Add slight tilt when hovered
      if (hovered) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
      } else {
        groupRef.current.rotation.y *= 0.95 // Smooth return to normal
      }
    }
  })

  return (
    <group 
      ref={groupRef} 
      position={position}
      scale={isVisible ? 1 : 0}
      onClick={onClick}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
        setHovered(true)
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
        setHovered(false)
      }}
      userData={{ type: 'paperGraphic', title: title }}
    >
      {/* Glow effect */}
      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <primitive object={glowGeometry} />
        <primitive object={glowMaterial} />
      </mesh>
      
      {/* Paper */}
      <mesh>
        <primitive object={paperGeometry} />
        <primitive object={paperMaterial} />
      </mesh>

      {/* Title */}
      <Html
        transform
        position={[0, 0, 0.1]}
        center
        style={{
          color: '#111111',
          fontSize: '0.3rem', // Larger text
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(0,255,0,0.5)',
          transition: 'all 0.3s ease',
          transform: `scale(${hovered ? 1.1 : 1})`
        }}
      >
        {title}
      </Html>
    </group>
  )
} 