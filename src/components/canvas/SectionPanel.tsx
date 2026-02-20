import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import type { Group } from 'three'
import { sections, useAppStore } from '../../stores/useAppStore'
import { iconComponents } from './Icons3D'

// Contenido de cada sección
const sectionContent: Record<string, { title: string; lines: string[] }> = {
  about: {
    title: 'SOBRE MÍ',
    lines: [
      'Desarrollador creativo apasionado',
      'por experiencias digitales únicas.',
      '',
      'Combino código y diseño para',
      'crear interfaces memorables.',
    ]
  },
  projects: {
    title: 'PROYECTOS',
    lines: [
      '▸ Portfolio 3D Interactivo',
      '▸ App de Visualización de Datos',
      '▸ Plataforma E-commerce',
      '▸ Sistema de Gestión Cloud',
    ]
  },
  skills: {
    title: 'HABILIDADES',
    lines: [
      'DE TODO UN POCO',
      '',
      'ALGO DE ESTO Y ALGO DE AQUELLO',
    ]
  },
  experience: {
    title: 'TECNOLOGÍAS',
    lines: [
      '◆ 123 Lotus',
      '◆ Office 97',
      '◆ Paint',
      '◆ Winamp',
    ]
  },
  contact: {
    title: 'CONTACTO',
    lines: [
      '✉ devjpben@gmail.com',
    ]
  }
}

// Botón de volver en 3D
function BackButton({ onClick }: { onClick: () => void }) {
  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: 1 },
    delay: 800,
    config: { mass: 1, tension: 200, friction: 20 }
  })

  return (
    <animated.group
      position={[0, -2.2, 0.1]}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <RoundedBox args={[1.5, 0.4, 0.1]} radius={0.05}>
        <meshStandardMaterial 
          color="#6366f1" 
          emissive="#6366f1"
          emissiveIntensity={0.3}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        ← VOLVER
      </Text>
    </animated.group>
  )
}

// Icono flotante de la sección activa
function FloatingIcon({ sectionId, color }: { sectionId: string; color: string }) {
  const groupRef = useRef<Group>(null)
  
  const { scale, position } = useSpring({
    from: { scale: 0, position: [0, 3, 0] as [number, number, number] },
    to: { scale: 1, position: [0, 2.3, 0] as [number, number, number] },
    config: { mass: 2, tension: 150, friction: 25 }
  })
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5
      groupRef.current.position.y = 2.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })
  
  const IconComponent = iconComponents[sectionId]
  
  return (
    <animated.group ref={groupRef} scale={scale} position={position}>
      <IconComponent color={color} hovered={true} />
    </animated.group>
  )
}

export default function SectionPanel() {
  const { currentSection, goHome } = useAppStore()
  const groupRef = useRef<Group>(null)
  const { viewport } = useThree()
  
  // Animación de entrada del panel
  const { scale, rotation } = useSpring({
    from: { 
      scale: 0, 
      rotation: [0, Math.PI, 0] as [number, number, number]
    },
    to: { 
      scale: currentSection ? 1 : 0, 
      rotation: [0, 0, 0] as [number, number, number]
    },
    config: { mass: 2, tension: 120, friction: 20 }
  })
  
  // Flotación sutil
  useFrame((state) => {
    if (groupRef.current && currentSection) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.03
      groupRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })
  
  if (!currentSection) return null
  
  // Projects tiene su propia visualización con satélites
  if (currentSection === 'projects') return null
  
  const section = sections.find(s => s.id === currentSection)
  const content = sectionContent[currentSection]
  
  if (!section || !content) return null
  
  // Calcular tamaño responsivo
  const panelWidth = Math.min(viewport.width * 0.6, 4)
  const panelHeight = Math.min(viewport.height * 0.5, 3)
  
  return (
    <animated.group 
      ref={groupRef}
      scale={scale}
      rotation={rotation as unknown as [number, number, number]}
    >
      {/* Icono flotante arriba */}
      <FloatingIcon sectionId={currentSection} color={section.color} />
      
      {/* Panel principal */}
      <group position={[0, 0, 0]}>
        {/* Fondo del panel con borde brillante */}
        <RoundedBox 
          args={[panelWidth, panelHeight, 0.1]} 
          radius={0.1}
          position={[0, 0, -0.05]}
        >
          <meshStandardMaterial 
            color="#0a0a15"
            transparent
            opacity={0.9}
          />
        </RoundedBox>
        
        {/* Borde brillante */}
        <RoundedBox 
          args={[panelWidth + 0.05, panelHeight + 0.05, 0.08]} 
          radius={0.1}
          position={[0, 0, -0.1]}
        >
          <meshStandardMaterial 
            color={section.color}
            emissive={section.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
          />
        </RoundedBox>
        
        {/* Título */}
        <Text
          position={[0, panelHeight / 2 - 0.4, 0.06]}
          fontSize={0.35}
          color={section.color}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          {content.title}
          <meshStandardMaterial 
            color={section.color}
            emissive={section.color}
            emissiveIntensity={0.4}
          />
        </Text>
        
        {/* Línea decorativa bajo el título */}
        <mesh position={[0, panelHeight / 2 - 0.7, 0.06]}>
          <boxGeometry args={[panelWidth * 0.6, 0.01, 0.01]} />
          <meshStandardMaterial 
            color={section.color}
            emissive={section.color}
            emissiveIntensity={0.6}
          />
        </mesh>
        
        {/* Contenido */}
        {content.lines.map((line, index) => (
          <Text
            key={index}
            position={[0, panelHeight / 2 - 1.1 - index * 0.35, 0.06]}
            fontSize={0.18}
            color="#cccccc"
            anchorX="center"
            anchorY="middle"
          >
            {line}
          </Text>
        ))}
      </group>
      
      {/* Botón volver */}
      <BackButton onClick={goHome} />
      
      {/* Partículas decorativas alrededor del panel */}
      <PanelParticles color={section.color} />
    </animated.group>
  )
}

// Partículas decorativas
function PanelParticles({ color }: { color: string }) {
  const groupRef = useRef<Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.2
    }
  })
  
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2
    const radius = 2.5 + Math.random() * 0.5
    return {
      position: [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -0.2
      ] as [number, number, number],
      scale: 0.02 + Math.random() * 0.03
    }
  })
  
  return (
    <group ref={groupRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.scale, 8, 8]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}
