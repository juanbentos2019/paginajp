import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Sphere, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'

// Definición de proyectos
interface Project {
  id: string
  name: string
  description: string
  url: string | null  // null = próximamente
  color: string
  position: [number, number, number]
}

const projects: Project[] = [
  {
    id: 'xcalcgold',
    name: 'XCalcGold',
    description: 'Calculadora de oro profesional',
    url: 'https://xcalcgold.com',
    color: '#ffd700',
    position: [-7.5, 3, -6]
  },
  {
    id: 'portfolio',
    name: 'Portfolio 3D',
    description: 'Este portfolio interactivo',
    url: null, // Es donde estamos
    color: '#6366f1',
    position: [7.5, 3, -6]
  },
  {
    id: 'coming1',
    name: 'Próximamente',
    description: 'Nuevo proyecto en desarrollo',
    url: null,
    color: '#4a4a4a',
    position: [-4.5, -3, -6]
  },
  {
    id: 'never',
    name: 'NUNCA',
    description: '¿En serio hiciste click aquí?',
    url: null,
    color: '#1a1a1a',
    position: [4.5, -3, -6]
  }
]

// Satélite individual de proyecto
function ProjectSatellite({ project, onSelect }: { project: Project; onSelect: (project: Project) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const baseY = useRef(project.position[1])
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Rotación constante
    groupRef.current.rotation.y += 0.01
    
    // Flotación
    groupRef.current.position.y = baseY.current + Math.sin(state.clock.elapsedTime * 2 + project.position[0]) * 0.1
    
    // Escala al hover
    const targetScale = hovered ? 1.2 : 1
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
  })
  
  const isClickable = project.url !== null
  
  return (
    <group 
      ref={groupRef}
      position={project.position}
      onClick={() => isClickable && onSelect(project)}
      onPointerOver={() => {
        if (isClickable) {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Cuerpo del satélite */}
      <Sphere args={[0.4, 32, 32]}>
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          metalness={0.7}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Anillos orbitales */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.02, 8, 32]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[0.55, 0.015, 8, 32]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Nombre del proyecto */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {project.name}
      </Text>
      
      {/* Descripción (solo si hovereado) */}
      {hovered && (
        <Text
          position={[0, -0.7, 0]}
          fontSize={0.1}
          color="#aaaaaa"
          anchorX="center"
          anchorY="middle"
        >
          {isClickable ? '▸ Click para visitar' : project.description}
        </Text>
      )}
      
      {/* Luz */}
      <pointLight color={project.color} intensity={hovered ? 3 : 1} distance={3} />
    </group>
  )
}

// Efecto túnel para transición a URL externa
function TunnelEffect({ active, color, onComplete }: { active: boolean; color: string; onComplete: () => void }) {
  const meshRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)
  const wasThirdPersonRef = useRef(false)
  const { camera } = useThree()
  
  // Forzar primera persona durante el túnel
  useEffect(() => {
    if (active) {
      const { isThirdPerson, setThirdPerson } = useAppStore.getState()
      wasThirdPersonRef.current = isThirdPerson
      if (isThirdPerson) {
        setThirdPerson(false)
      }
    } else {
      // Restaurar modo anterior cuando termina
      if (wasThirdPersonRef.current) {
        const { setThirdPerson } = useAppStore.getState()
        setThirdPerson(true)
      }
    }
  }, [active])
  
  const particleCount = 1500
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const vel = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 0.5 + Math.random() * 8
      const z = Math.random() * 100
      
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = Math.sin(angle) * radius
      pos[i * 3 + 2] = z
      
      vel[i] = 0.8 + Math.random() * 1.2
    }
    
    return { positions: pos, velocities: vel }
  }, [])
  
  useFrame((_, delta) => {
    if (!meshRef.current || !active) return
    
    progressRef.current += delta * 0.5
    
    // Mover partículas hacia la cámara
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3 + 2] -= velocities[i] * delta * 80
      
      // Reset cuando pasan
      if (posArray[i * 3 + 2] < -5) {
        posArray[i * 3 + 2] = 100
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
    
    // Completar después de 2 segundos
    if (progressRef.current > 2) {
      onComplete()
    }
    
    // Seguir cámara
    meshRef.current.position.copy(camera.position)
    meshRef.current.rotation.copy(camera.rotation)
  })
  
  if (!active) return null
  
  const colorObj = new THREE.Color(color)
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={colorObj}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// Botón de volver
function BackButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <group
      position={[0, -2.5, -1]}
      onClick={onClick}
      onPointerOver={() => {
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <RoundedBox args={[1.8, 0.5, 0.1]} radius={0.08}>
        <meshStandardMaterial
          color={hovered ? '#8b5cf6' : '#6366f1'}
          emissive={hovered ? '#8b5cf6' : '#6366f1'}
          emissiveIntensity={hovered ? 0.6 : 0.3}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        ← VOLVER
      </Text>
    </group>
  )
}

// Sección completa de proyectos
export default function ProjectsSection() {
  const { currentSection, goHome } = useAppStore()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [tunnelActive, setTunnelActive] = useState(false)
  
  // Manejar selección de proyecto
  const handleProjectSelect = (project: Project) => {
    if (project.url) {
      setSelectedProject(project)
      setTunnelActive(true)
    }
  }
  
  // Cuando el túnel completa, redirigir
  const handleTunnelComplete = () => {
    if (selectedProject?.url) {
      window.open(selectedProject.url, '_blank')
    }
    setTunnelActive(false)
    setSelectedProject(null)
  }
  
  // Reset al salir de la sección
  useEffect(() => {
    if (currentSection !== 'projects') {
      setTunnelActive(false)
      setSelectedProject(null)
    }
  }, [currentSection])
  
  if (currentSection !== 'projects') return null
  
  return (
    <>
      {/* Satélites de proyectos */}
      {projects.map((project) => (
        <ProjectSatellite
          key={project.id}
          project={project}
          onSelect={handleProjectSelect}
        />
      ))}
      
      {/* Efecto túnel */}
      <TunnelEffect
        active={tunnelActive}
        color={selectedProject?.color || '#ffffff'}
        onComplete={handleTunnelComplete}
      />
      
      {/* Título de la sección */}
      <Text
        position={[0, 2.5, -2]}
        fontSize={0.4}
        color="#ec4899"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        PROYECTOS
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={0.4}
        />
      </Text>
      
      {/* Instrucciones */}
      <Text
        position={[0, -1.8, -2]}
        fontSize={0.12}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        Haz click en un satélite para visitar el proyecto
      </Text>
      
      {/* Botón volver */}
      <BackButton onClick={goHome} />
    </>
  )
}
