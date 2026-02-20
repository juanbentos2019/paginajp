import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import { useSpring, animated, config } from '@react-spring/three'
import * as THREE from 'three'
import type { Group } from 'three'
import { sections, useAppStore } from '../../stores/useAppStore'
import { iconComponents } from './Icons3D'
import './NavShapes.css'

// Posiciones FIJAS de los planetas en el espacio 3D
// Distribuidos alrededor del centro (origen) donde está "JUAN B."
// Alejados 3x del centro original para mayor dispersión
export const planetPositions: Record<string, THREE.Vector3> = {
  about:      new THREE.Vector3(0, 45, -120),      // Arriba-adelante
  projects:   new THREE.Vector3(-150, -30, -75),   // Izquierda-abajo
  skills:     new THREE.Vector3(150, 15, -90),     // Derecha
  experience: new THREE.Vector3(-90, 75, 60),      // Izquierda-arriba-atrás
  contact:    new THREE.Vector3(105, -60, 75),     // Derecha-abajo-atrás
}

interface PlanetProps {
  id: string
  name: string
  color: string
  position: THREE.Vector3
}

function Planet({ id, name, color, position }: PlanetProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const { navigateTo, setHoveredSection, currentSection, isWarping } = useAppStore()
  
  const isActive = !currentSection && !isWarping
  
  // Animación de escala
  const { scale } = useSpring({
    scale: hovered ? 1.5 : 1,
    config: config.wobbly,
  })
  
  // Rotación propia del planeta
  useFrame(() => {
    if (!groupRef.current) return
    
    // Rotación continua
    groupRef.current.rotation.y += 0.008
  })
  
  const handleClick = () => {
    if (isActive) {
      navigateTo(id)
    }
  }
  
  const handlePointerOver = () => {
    if (!isActive) return
    setHovered(true)
    setHoveredSection(id)
    document.body.style.cursor = 'pointer'
  }
  
  const handlePointerOut = () => {
    setHovered(false)
    setHoveredSection(null)
    document.body.style.cursor = 'auto'
  }
  
  const IconComponent = iconComponents[id]
  
  return (
    <group position={[position.x, position.y, position.z]}>
      <animated.group
        ref={groupRef}
        scale={scale}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Icono 3D del planeta */}
        <IconComponent color={color} hovered={hovered} />
        
        {/* Aura/glow del planeta */}
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={hovered ? 0.2 : 0.08}
          />
        </mesh>
        
        {/* Anillo orbital decorativo */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.02, 8, 32]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={hovered ? 0.4 : 0.15}
          />
        </mesh>
        
        {/* Label del planeta - dentro del grupo animado para seguir al icono */}
        <Billboard position={[0, -1.5, 0]}>
          <Text
            fontSize={0.4}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
            fillOpacity={hovered ? 1 : 0.9}
          >
            {name.toUpperCase()}
          </Text>
        </Billboard>
      </animated.group>
      
      {/* Luz puntual del planeta */}
      <pointLight 
        color={color} 
        intensity={hovered ? 2 : 0.5} 
        distance={8} 
        decay={2}
      />
    </group>
  )
}

export default function NavShapes() {
  return (
    <group>
      {/* Planetas en posiciones fijas */}
      {sections.map((section) => (
        <Planet
          key={section.id}
          id={section.id}
          name={section.name}
          color={section.color}
          position={planetPositions[section.id]}
        />
      ))}
    </group>
  )
}
