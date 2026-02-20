import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticlesProps {
  count?: number
}

// Capa individual de estrellas
function StarLayer({ 
  count, 
  minRadius, 
  maxRadius, 
  size, 
  opacity, 
  color,
  rotationSpeed 
}: { 
  count: number
  minRadius: number
  maxRadius: number
  size: number
  opacity: number
  color: string
  rotationSpeed: number
}) {
  const mesh = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const radius = minRadius + Math.random() * (maxRadius - minRadius)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    
    return pos
  }, [count, minRadius, maxRadius])
  
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * rotationSpeed
      mesh.current.rotation.x += delta * rotationSpeed * 0.3
    }
  })
  
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// Estrellas brillantes con parpadeo
function BrightStars({ count }: { count: number }) {
  const mesh = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const radius = 100 + Math.random() * 300
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    
    return pos
  }, [count])
  
  useFrame((state) => {
    if (materialRef.current) {
      // Parpadeo sutil
      materialRef.current.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })
  
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.4}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function Particles({ count = 2000 }: ParticlesProps) {
  return (
    <group>
      {/* Capa 1: Estrellas muy lejanas y tenues (fondo infinito) */}
      <StarLayer
        count={count * 4}
        minRadius={300}
        maxRadius={1000}
        size={0.1}
        opacity={0.3}
        color="#ffffff"
        rotationSpeed={0.001}
      />
      
      {/* Capa 2: Estrellas lejanas */}
      <StarLayer
        count={count * 2}
        minRadius={150}
        maxRadius={400}
        size={0.15}
        opacity={0.5}
        color="#ffffff"
        rotationSpeed={0.002}
      />
      
      {/* Capa 3: Estrellas medias */}
      <StarLayer
        count={count}
        minRadius={80}
        maxRadius={200}
        size={0.18}
        opacity={0.7}
        color="#ffffff"
        rotationSpeed={0.004}
      />
      
      {/* Capa 4: Estrellas cercanas y brillantes */}
      <StarLayer
        count={Math.floor(count * 0.5)}
        minRadius={40}
        maxRadius={120}
        size={0.25}
        opacity={0.9}
        color="#ffffff"
        rotationSpeed={0.006}
      />
      
      {/* Estrellas muy brillantes con parpadeo */}
      <BrightStars count={60} />
    </group>
  )
}
