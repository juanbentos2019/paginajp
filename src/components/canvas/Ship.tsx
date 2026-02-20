import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import SpaceCockpit from './SpaceCockpit'
import { useShipControls } from '../../hooks/useShipControls'
import { useAppStore } from '../../stores/useAppStore'

// Precargar modelo de nave
useGLTF.preload('/models/scene.gltf')

// Componente que hace que el cockpit siga a la cámara (solo en primera persona)
function CockpitFollower() {
  const cockpitRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const { currentSection, isThirdPerson } = useAppStore()
  
  useFrame(() => {
    if (cockpitRef.current) {
      // El cockpit sigue la posición y rotación de la cámara
      cockpitRef.current.position.copy(camera.position)
      cockpitRef.current.rotation.copy(camera.rotation)
    }
  })
  
  // No mostrar cockpit en tercera persona o dentro de una sección
  if (currentSection || isThirdPerson) return null
  
  return (
    <group ref={cockpitRef}>
      {/* Cockpit escalado y posicionado relativo a la cámara */}
      <group scale={1} position={[0, -2, -3]} rotation={[0, 0, 0]}>
        <SpaceCockpit />
      </group>
    </group>
  )
}

// Modelo 3D de la nave visible en tercera persona
function ShipModel({ shipRef }: { shipRef: React.RefObject<THREE.Group> }) {
  const { scene } = useGLTF('/models/scene.gltf')
  const { isThirdPerson, currentSection } = useAppStore()
  const modelRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (modelRef.current && shipRef.current) {
      // El modelo sigue la posición y rotación del shipRef
      modelRef.current.position.copy(shipRef.current.position)
      modelRef.current.rotation.copy(shipRef.current.rotation)
    }
  })
  
  // Solo mostrar en tercera persona y fuera de secciones
  if (!isThirdPerson || currentSection) return null
  
  return (
    <group ref={modelRef}>
      <primitive 
        object={scene.clone()} 
        scale={0.5} 
        rotation={[0, Math.PI, 0]} 
      />
      {/* Luces de motor */}
      <pointLight position={[0.3, -0.1, 0.5]} color="#4fc3f7" intensity={2} distance={3} />
      <pointLight position={[-0.3, -0.1, 0.5]} color="#4fc3f7" intensity={2} distance={3} />
    </group>
  )
}

export default function Ship() {
  const shipRef = useRef<THREE.Group>(null!)
  
  // Inicializar controles de nave
  useShipControls(shipRef)
  
  return (
    <>
      {/* Grupo invisible para controles de movimiento */}
      <group ref={shipRef} position={[0, 0, 12]} />
      
      {/* Modelo de nave (solo en tercera persona) */}
      <ShipModel shipRef={shipRef} />
      
      {/* Cockpit que sigue a la cámara (solo en primera persona) */}
      <CockpitFollower />
    </>
  )
}
