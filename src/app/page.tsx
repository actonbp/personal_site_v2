"use client"

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'

const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false
})

const TopicWords = dynamic(() => import('@/components/TopicWords'), {
  ssr: false
})

const MatrixRain = dynamic(() => import('@/components/MatrixRain'), {
  ssr: false
})

const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  {
    ssr: false
  }
)

const OrbitControls = dynamic(
  () => import('@react-three/drei').then((mod) => mod.OrbitControls),
  { ssr: false }
)

// Topic positions for the matrix rain transformation
const topicPositions: { [key: string]: [number, number, number] } = {
  "Agents": [-8, 4, 0],
  "Embeddings": [8, -2, 2],
  "Leadership": [-4, -4, -2],
  "Teams": [4, 2, -4],
  "Memory": [-6, 0, 4],
  "Identity": [0, -2, -4],
}

export default function Home() {
  const [focusedTopic, setFocusedTopic] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-green-400 text-xl">Loading 3D visualization...</div>
        </div>
      }>
        <Canvas
          style={{ width: '100vw', height: '100vh' }}
          camera={{
            position: [0, 0, 20],
            fov: 75,
            near: 0.1,
            far: 1000,
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.5} />
          <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} />
          <Scene />
          <MatrixRain focusedTopic={focusedTopic} topicPositions={topicPositions} />
          <TopicWords onTopicFocus={setFocusedTopic} />
        </Canvas>
      </Suspense>
    </div>
  )
}
