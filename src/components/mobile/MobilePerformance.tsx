"use client"

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function MobilePerformance() {
  const { gl, scene } = useThree()
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Optimize renderer for mobile
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      
      // Reduce shadow quality on mobile
      gl.shadowMap.enabled = true
      gl.shadowMap.type = 2 // THREE.PCFSoftShadowMap
      
      // Reduce the number of lights that cast shadows
      scene.traverse((object) => {
        // Type check and cast to Light if it's a light
        if (object instanceof THREE.Light && 'shadow' in object) {
          const light = object as THREE.Light & { shadow: THREE.LightShadow }
          light.shadow.mapSize.width = 512
          light.shadow.mapSize.height = 512
          light.castShadow = false // Disable shadows on mobile for performance
        }
      })
      
      // Optimize texture quality
      const lowerTextureQuality = () => {
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const mesh = object as THREE.Mesh
            
            // Handle array of materials
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(material => {
                if (material instanceof THREE.MeshStandardMaterial && material.map) {
                  material.map.minFilter = THREE.LinearFilter
                  material.map.generateMipmaps = false
                }
              })
            } 
            // Handle single material
            else if (mesh.material instanceof THREE.MeshStandardMaterial && mesh.material.map) {
              mesh.material.map.minFilter = THREE.LinearFilter
              mesh.material.map.generateMipmaps = false
            }
          }
        })
      }
      
      lowerTextureQuality()
      
      // Reduce particle count for mobile
      scene.traverse((object) => {
        if (object instanceof THREE.Points && object.geometry) {
          // If this is a particle system, reduce the number of particles
          const originalCount = object.geometry.attributes.position.count
          const newCount = Math.floor(originalCount * 0.5) // Reduce by 50%
          
          if (newCount < originalCount) {
            const positions = object.geometry.attributes.position.array
            const newPositions = new Float32Array(newCount * 3)
            
            // Copy only a portion of the particles
            for (let i = 0; i < newCount * 3; i++) {
              newPositions[i] = positions[i]
            }
            
            // Update the geometry
            object.geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3))
          }
        }
      })
      
      // Monitor performance and adjust quality if needed
      let frameCount = 0
      let lastTime = performance.now()
      let fps = 60
      
      const checkPerformance = () => {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - lastTime >= 1000) {
          fps = frameCount
          frameCount = 0
          lastTime = currentTime
          
          // If FPS drops below threshold, reduce quality further
          if (fps < 30) {
            gl.setPixelRatio(1.0)
            // Further optimizations could be applied here
          }
        }
        
        requestAnimationFrame(checkPerformance)
      }
      
      const perfCheckId = requestAnimationFrame(checkPerformance)
      
      return () => {
        cancelAnimationFrame(perfCheckId)
      }
    }
  }, [gl, scene])
  
  return null
} 