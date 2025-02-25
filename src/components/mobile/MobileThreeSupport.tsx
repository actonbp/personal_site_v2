"use client"

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * MobileThreeSupport component enhances Three.js performance on mobile devices
 * This component should be added inside your Canvas component
 */
export default function MobileThreeSupport() {
  const { gl, scene, camera } = useThree()
  
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      console.log('Applying Three.js mobile optimizations')
      
      // Optimize renderer for mobile
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      gl.setClearColor(0x000000, 1)
      
      // Optimize shadows for mobile
      gl.shadowMap.enabled = true
      gl.shadowMap.type = THREE.PCFSoftShadowMap
      gl.shadowMap.autoUpdate = false
      gl.shadowMap.needsUpdate = true
      
      // Adjust camera for mobile view
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 75 // Wider FOV for mobile
        camera.updateProjectionMatrix()
      }
      
      // Optimize scene for mobile
      const optimizeScene = () => {
        scene.traverse((object) => {
          // Reduce shadow quality
          if (object instanceof THREE.Light && 'shadow' in object) {
            const light = object as THREE.Light & { shadow: THREE.LightShadow }
            if (light.shadow && light.shadow.map) {
              light.shadow.mapSize.width = 512
              light.shadow.mapSize.height = 512
              light.castShadow = false // Disable shadows on mobile for performance
            }
          }
          
          // Optimize materials
          if (object instanceof THREE.Mesh) {
            const mesh = object
            
            // Handle array of materials
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                // Skip if not a standard material
                if (!(mat instanceof THREE.MeshStandardMaterial || 
                      mat instanceof THREE.MeshBasicMaterial || 
                      mat instanceof THREE.MeshPhongMaterial)) {
                  return
                }
                
                // Safely access map property
                const material = mat as THREE.Material & { map?: THREE.Texture }
                if (material.map) {
                  // Use direct property assignment
                  material.map.generateMipmaps = false
                  // Use numeric constant directly
                  Object.defineProperty(material.map, 'minFilter', {
                    value: 1006, // THREE.LinearFilter
                    writable: true
                  })
                }
              })
            } 
            // Handle single material
            else if (mesh.material) {
              // Skip if not a standard material
              if (!(mesh.material instanceof THREE.MeshStandardMaterial || 
                    mesh.material instanceof THREE.MeshBasicMaterial || 
                    mesh.material instanceof THREE.MeshPhongMaterial)) {
                return
              }
              
              // Safely access map property
              const material = mesh.material as THREE.Material & { map?: THREE.Texture }
              if (material.map) {
                // Use direct property assignment
                material.map.generateMipmaps = false
                // Use numeric constant directly
                Object.defineProperty(material.map, 'minFilter', {
                  value: 1006, // THREE.LinearFilter
                  writable: true
                })
              }
            }
          }
          
          // Reduce particle count
          if (object instanceof THREE.Points && object.geometry) {
            const points = object
            const originalCount = points.geometry.attributes.position.count
            
            // Only reduce if there are many particles
            if (originalCount > 1000) {
              const newCount = Math.floor(originalCount * 0.5) // Reduce by 50%
              const positions = points.geometry.attributes.position.array
              const newPositions = new Float32Array(newCount * 3)
              
              // Copy only a portion of the particles
              for (let i = 0; i < newCount * 3; i++) {
                newPositions[i] = positions[i]
              }
              
              // Update the geometry
              points.geometry.setAttribute('position', 
                new THREE.BufferAttribute(newPositions, 3)
              )
            }
          }
        })
      }
      
      // Run optimization
      optimizeScene()
      
      // Set up performance monitoring
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
      
      // Listen for scene changes to re-optimize
      const handleSceneChange = () => {
        optimizeScene()
      }
      
      scene.addEventListener('added', handleSceneChange)
      
      return () => {
        cancelAnimationFrame(perfCheckId)
        scene.removeEventListener('added', handleSceneChange)
      }
    }
  }, [gl, scene, camera])
  
  return null
} 