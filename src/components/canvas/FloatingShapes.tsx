import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, Group } from 'three'

// Configuración de cada forma
interface ShapeConfig {
  position: [number, number, number]
  geometry: 'box' | 'sphere' | 'octahedron' | 'torus' | 'cone' | 'dodecahedron'
  color: string
  scale: number
  rotationSpeed: [number, number, number]
  floatSpeed: number
  floatAmplitude: number
}

// Componente individual para cada forma
function Shape({ config }: { config: ShapeConfig }) {
  const meshRef = useRef<Mesh>(null)
  const initialY = config.position[1]
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Rotación continua
    meshRef.current.rotation.x += delta * config.rotationSpeed[0]
    meshRef.current.rotation.y += delta * config.rotationSpeed[1]
    meshRef.current.rotation.z += delta * config.rotationSpeed[2]
    
    // Movimiento flotante (sube y baja)
    meshRef.current.position.y = initialY + 
      Math.sin(state.clock.elapsedTime * config.floatSpeed) * config.floatAmplitude
  })
  
  const geometryElement = useMemo(() => {
    switch (config.geometry) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />
      case 'sphere':
        return <sphereGeometry args={[0.6, 32, 32]} />
      case 'octahedron':
        return <octahedronGeometry args={[0.7]} />
      case 'torus':
        return <torusGeometry args={[0.5, 0.2, 16, 32]} />
      case 'cone':
        return <coneGeometry args={[0.5, 1, 32]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[0.6]} />
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }, [config.geometry])
  
  return (
    <mesh 
      ref={meshRef} 
      position={config.position}
      scale={config.scale}
    >
      {geometryElement}
      <meshStandardMaterial 
        color={config.color} 
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  )
}

// Configuración de todas las formas
const shapes: ShapeConfig[] = [
  // Frente (cerca de la cámara)
  { position: [-2, 0.5, 2], geometry: 'octahedron', color: '#6366f1', scale: 0.8, rotationSpeed: [0.3, 0.5, 0.2], floatSpeed: 1.2, floatAmplitude: 0.3 },
  { position: [2.5, -0.5, 1], geometry: 'torus', color: '#ec4899', scale: 0.9, rotationSpeed: [0.4, 0.3, 0.1], floatSpeed: 0.8, floatAmplitude: 0.25 },
  
  // Medio
  { position: [-3, 1.5, -1], geometry: 'dodecahedron', color: '#14b8a6', scale: 0.7, rotationSpeed: [0.2, 0.4, 0.3], floatSpeed: 1.0, floatAmplitude: 0.35 },
  { position: [0, -1.5, 0], geometry: 'box', color: '#f59e0b', scale: 0.6, rotationSpeed: [0.5, 0.2, 0.4], floatSpeed: 1.4, floatAmplitude: 0.2 },
  { position: [3, 1, -2], geometry: 'sphere', color: '#8b5cf6', scale: 1.0, rotationSpeed: [0.1, 0.3, 0.2], floatSpeed: 0.9, floatAmplitude: 0.4 },
  
  // Fondo (lejos de la cámara)
  { position: [-1.5, 2, -4], geometry: 'cone', color: '#ef4444', scale: 0.9, rotationSpeed: [0.3, 0.2, 0.5], floatSpeed: 0.7, floatAmplitude: 0.3 },
  { position: [1, -2, -3], geometry: 'octahedron', color: '#22c55e', scale: 0.5, rotationSpeed: [0.4, 0.6, 0.2], floatSpeed: 1.1, floatAmplitude: 0.25 },
  { position: [-4, -1, -5], geometry: 'torus', color: '#3b82f6', scale: 1.2, rotationSpeed: [0.2, 0.3, 0.4], floatSpeed: 0.6, floatAmplitude: 0.45 },
  { position: [4, 0.5, -6], geometry: 'dodecahedron', color: '#f97316', scale: 0.8, rotationSpeed: [0.3, 0.4, 0.1], floatSpeed: 1.3, floatAmplitude: 0.35 },
  
  // Extra profundidad
  { position: [0, 1, -8], geometry: 'sphere', color: '#a855f7', scale: 1.5, rotationSpeed: [0.1, 0.2, 0.1], floatSpeed: 0.5, floatAmplitude: 0.5 },
  { position: [-3, -0.5, -7], geometry: 'box', color: '#06b6d4', scale: 0.7, rotationSpeed: [0.4, 0.3, 0.3], floatSpeed: 0.8, floatAmplitude: 0.3 },
]

export default function FloatingShapes() {
  const groupRef = useRef<Group>(null)
  
  // Rotación suave del grupo completo
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })
  
  return (
    <group ref={groupRef}>
      {shapes.map((shape, index) => (
        <Shape key={index} config={shape} />
      ))}
    </group>
  )
}
