import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ExplosionProps {
  position: THREE.Vector3
  color?: string
  onComplete?: () => void
}

export default function Explosion({ position, color = '#ef4444', onComplete }: ExplosionProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [particles] = useState(() => {
    // Crear partículas con direcciones aleatorias
    return Array.from({ length: 30 }, () => ({
      direction: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize(),
      speed: 5 + Math.random() * 10,
      size: 0.1 + Math.random() * 0.2,
    }))
  })
  
  const progressRef = useRef(0)
  const startTime = useRef(Date.now())
  const duration = 1000 // 1 segundo
  
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    const elapsed = Date.now() - startTime.current
    progressRef.current = Math.min(elapsed / duration, 1)
    
    // Actualizar cada partícula
    groupRef.current.children.forEach((child, i) => {
      const particle = particles[i]
      if (!particle) return
      
      const mesh = child as THREE.Mesh
      
      // Mover hacia afuera
      mesh.position.addScaledVector(particle.direction, particle.speed * delta)
      
      // Reducir escala
      const scale = 1 - progressRef.current
      mesh.scale.setScalar(scale * particle.size * 5)
      
      // Reducir opacidad
      const material = mesh.material as THREE.MeshBasicMaterial
      material.opacity = (1 - progressRef.current) * 0.8
    })
    
    // Completar cuando termina
    if (progressRef.current >= 1) {
      onComplete?.()
    }
  })
  
  return (
    <group ref={groupRef} position={position}>
      {particles.map((particle, i) => (
        <mesh key={i} scale={particle.size}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial 
            color={i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? color : '#ffa500'} 
            transparent 
            opacity={0.8}
          />
        </mesh>
      ))}
      
      {/* Flash central */}
      <pointLight color={color} intensity={10} distance={15} decay={2} />
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1 - progressRef.current} />
      </mesh>
    </group>
  )
}
