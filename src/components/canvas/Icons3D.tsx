import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

interface IconProps {
  color: string
  hovered: boolean
}

// Icono: Persona (Sobre Mí)
export function PersonIcon({ color, hovered }: IconProps) {
  const groupRef = useRef<Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })
  
  const emissiveIntensity = hovered ? 0.4 : 0.1
  
  return (
    <group ref={groupRef}>
      {/* Cabeza */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Cuerpo */}
      <mesh position={[0, -0.1, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 16, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  )
}

// Icono: Código/Proyectos
export function CodeIcon({ color, hovered }: IconProps) {
  const groupRef = useRef<Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })
  
  const emissiveIntensity = hovered ? 0.4 : 0.1
  const mat = { color, emissive: color, emissiveIntensity, metalness: 0.3, roughness: 0.4 }
  
  return (
    <group ref={groupRef}>
      {/* Bracket izquierdo < */}
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      
      {/* Barra diagonal / */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      
      {/* Bracket derecho > */}
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  )
}

// Icono: Engranaje (Habilidades)
export function GearIcon({ color, hovered }: IconProps) {
  const groupRef = useRef<Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.8
    }
  })
  
  const emissiveIntensity = hovered ? 0.4 : 0.1
  const mat = { color, emissive: color, emissiveIntensity, metalness: 0.3, roughness: 0.4 }
  const teeth = 8
  
  return (
    <group ref={groupRef}>
      {/* Centro del engranaje */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 32]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Agujero central */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
        <meshStandardMaterial color="#0a0a0f" />
      </mesh>
      {/* Dientes */}
      {Array.from({ length: teeth }).map((_, i) => {
        const angle = (i / teeth) * Math.PI * 2
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4]}
            rotation={[Math.PI / 2, 0, angle]}
          >
            <boxGeometry args={[0.15, 0.15, 0.2]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        )
      })}
    </group>
  )
}

// Icono: Maletín (Experiencia)
export function BriefcaseIcon({ color, hovered }: IconProps) {
  const groupRef = useRef<Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })
  
  const emissiveIntensity = hovered ? 0.4 : 0.1
  const mat = { color, emissive: color, emissiveIntensity, metalness: 0.3, roughness: 0.4 }
  
  return (
    <group ref={groupRef}>
      {/* Cuerpo del maletín */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.7, 0.45, 0.25]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Asa superior */}
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.15, 0.04, 8, 16, Math.PI]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Cierre */}
      <mesh position={[0, 0.05, 0.13]}>
        <boxGeometry args={[0.15, 0.08, 0.02]} />
        <meshStandardMaterial color="#0a0a0f" />
      </mesh>
    </group>
  )
}

// Icono: Sobre de carta (Contacto)
export function EnvelopeIcon({ color, hovered }: IconProps) {
  const groupRef = useRef<Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })
  
  const emissiveIntensity = hovered ? 0.4 : 0.1
  const mat = { color, emissive: color, emissiveIntensity, metalness: 0.3, roughness: 0.4 }
  
  return (
    <group ref={groupRef}>
      {/* Cuerpo del sobre */}
      <mesh>
        <boxGeometry args={[0.7, 0.45, 0.08]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Solapa triangular superior */}
      <mesh position={[0, 0.15, 0.05]} rotation={[Math.PI / 5, 0, 0]}>
        <boxGeometry args={[0.6, 0.35, 0.02]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Líneas decorativas (simulando carta) */}
      <mesh position={[0, -0.05, 0.05]}>
        <boxGeometry args={[0.4, 0.03, 0.01]} />
        <meshStandardMaterial color="#0a0a0f" />
      </mesh>
      <mesh position={[0, -0.12, 0.05]}>
        <boxGeometry args={[0.3, 0.03, 0.01]} />
        <meshStandardMaterial color="#0a0a0f" />
      </mesh>
    </group>
  )
}

// Mapa de iconos por ID de sección
export const iconComponents: Record<string, React.FC<IconProps>> = {
  about: PersonIcon,
  projects: CodeIcon,
  skills: GearIcon,
  experience: BriefcaseIcon,
  contact: EnvelopeIcon,
}
