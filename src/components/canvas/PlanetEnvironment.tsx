import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'

// Configuración de ambiente por sección
const environmentConfigs: Record<string, {
  skyColor: string
  fogColor: string
  fogNear: number
  fogFar: number
  ambientColor: string
  ambientIntensity: number
  particleColor: string
  particleCount: number
  groundColor: string
  accentLight: string
}> = {
  about: {
    skyColor: '#0a0a20',
    fogColor: '#1a1a3e',
    fogNear: 5,
    fogFar: 30,
    ambientColor: '#6366f1',
    ambientIntensity: 0.4,
    particleColor: '#818cf8',
    particleCount: 300,
    groundColor: '#1e1b4b',
    accentLight: '#a5b4fc',
  },
  projects: {
    skyColor: '#1a0a15',
    fogColor: '#2d1a2a',
    fogNear: 5,
    fogFar: 35,
    ambientColor: '#ec4899',
    ambientIntensity: 0.35,
    particleColor: '#f472b6',
    particleCount: 400,
    groundColor: '#4a1942',
    accentLight: '#fb7185',
  },
  skills: {
    skyColor: '#051a1a',
    fogColor: '#0a2e2e',
    fogNear: 5,
    fogFar: 30,
    ambientColor: '#14b8a6',
    ambientIntensity: 0.4,
    particleColor: '#5eead4',
    particleCount: 350,
    groundColor: '#134e4a',
    accentLight: '#2dd4bf',
  },
  experience: {
    skyColor: '#1a1005',
    fogColor: '#2d2410',
    fogNear: 5,
    fogFar: 30,
    ambientColor: '#f59e0b',
    ambientIntensity: 0.4,
    particleColor: '#fbbf24',
    particleCount: 250,
    groundColor: '#451a03',
    accentLight: '#fcd34d',
  },
  contact: {
    skyColor: '#051a0a',
    fogColor: '#0a2d15',
    fogNear: 5,
    fogFar: 30,
    ambientColor: '#22c55e',
    ambientIntensity: 0.4,
    particleColor: '#4ade80',
    particleCount: 300,
    groundColor: '#14532d',
    accentLight: '#86efac',
  },
}

// Partículas flotantes del ambiente
function EnvironmentParticles({ color, count }: { color: string, count: number }) {
  const meshRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribuir en un cilindro alrededor del jugador
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 15
      const height = (Math.random() - 0.5) * 20
      
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = height
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }
    return pos
  }, [count])
  
  useFrame((state) => {
    if (meshRef.current) {
      // Rotación lenta y movimiento vertical
      meshRef.current.rotation.y += 0.002
      
      // Hacer que las partículas "floten"
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i * 0.1) * 0.002
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// Suelo/plataforma del ambiente
function EnvironmentGround({ color, accentColor }: { color: string, accentColor: string }) {
  const ringRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.1
    }
  })
  
  return (
    <group position={[0, -3, 0]}>
      {/* Plataforma circular principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.7}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Anillo brillante */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[7, 7.5, 64]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Anillo exterior */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[9, 9.2, 64]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* Grid pattern */}
      <gridHelper args={[20, 20, accentColor, color]} position={[0, 0.03, 0]} />
    </group>
  )
}

// Columnas de luz decorativas
function LightPillars({ color, count = 6 }: { color: string, count?: number }) {
  const pillars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const radius = 6
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        height: 8 + Math.random() * 4,
        delay: i * 0.2,
      }
    })
  }, [count])
  
  return (
    <group>
      {pillars.map((pillar, i) => (
        <PillarBeam key={i} {...pillar} color={color} />
      ))}
    </group>
  )
}

function PillarBeam({ x, z, height, color, delay }: { x: number, z: number, height: number, color: string, delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.2 + 0.8
      ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.5
    }
  })
  
  return (
    <mesh ref={meshRef} position={[x, height / 2 - 3, z]}>
      <cylinderGeometry args={[0.05, 0.1, height, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.4}
      />
    </mesh>
  )
}

// Componente principal del ambiente
export default function PlanetEnvironment() {
  const { currentSection } = useAppStore()
  const groupRef = useRef<THREE.Group>(null)
  
  // Animación de entrada
  const { scale } = useSpring({
    scale: currentSection ? 1 : 0,
    config: { mass: 1, tension: 120, friction: 20 },
  })
  
  if (!currentSection) return null
  
  const config = environmentConfigs[currentSection]
  if (!config) return null
  
  return (
    <animated.group ref={groupRef} scale={scale}>
      {/* Cielo/Fondo del ambiente */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color={config.skyColor} side={THREE.BackSide} />
      </mesh>
      
      {/* Niebla atmosférica - se aplica globalmente */}
      <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />
      
      {/* Iluminación del ambiente */}
      <ambientLight intensity={config.ambientIntensity} color={config.ambientColor} />
      <pointLight position={[0, 10, 0]} intensity={1} color={config.accentLight} distance={30} />
      <pointLight position={[5, 3, 5]} intensity={0.5} color={config.accentLight} distance={15} />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color={config.ambientColor} distance={15} />
      
      {/* Elementos del ambiente */}
      <EnvironmentParticles color={config.particleColor} count={config.particleCount} />
      <EnvironmentGround color={config.groundColor} accentColor={config.accentLight} />
      <LightPillars color={config.accentLight} />
    </animated.group>
  )
}
