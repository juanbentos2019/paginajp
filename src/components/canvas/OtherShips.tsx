import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'
import type { OtherPlayer } from '../../stores/useAppStore'

// Precargar el modelo
useGLTF.preload('/models/scene.gltf')

// Nave individual de otro jugador
function OtherShip({ player }: { player: OtherPlayer }) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/scene.gltf')
  
  // Clonar el modelo para cada nave
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    // Aplicar color del jugador a los materiales
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = (child.material as THREE.MeshStandardMaterial).clone()
        material.emissive = new THREE.Color(player.color)
        material.emissiveIntensity = 0.2
        child.material = material
      }
    })
    return clone
  }, [scene, player.color])
  
  const targetPosition = useRef(new THREE.Vector3(player.position.x, player.position.y, player.position.z))
  const targetRotation = useRef(new THREE.Euler(player.rotation.x, player.rotation.y, player.rotation.z))
  
  // Actualizar targets cuando cambian los datos
  targetPosition.current.set(player.position.x, player.position.y, player.position.z)
  targetRotation.current.set(player.rotation.x, player.rotation.y, player.rotation.z)
  
  // Interpolar posición y rotación para movimiento suave
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    // Lerp suave hacia la posición objetivo
    groupRef.current.position.lerp(targetPosition.current, delta * 10)
    
    // Interpolar rotación
    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * delta * 10
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * delta * 10
    groupRef.current.rotation.z += (targetRotation.current.z - groupRef.current.rotation.z) * delta * 10
  })
  
  // No mostrar si está protegido (dentro de un planeta)
  if (player.isProtected) return null
  
  return (
    <group 
      ref={groupRef} 
      position={[player.position.x, player.position.y, player.position.z]}
      rotation={[player.rotation.x, player.rotation.y, player.rotation.z]}
    >
      {/* Modelo 3D de la nave - ajustar escala según el modelo */}
      <primitive object={clonedScene} scale={0.5} rotation={[0, Math.PI, 0]} />
      
      {/* Luz del motor */}
      <pointLight 
        position={[0, 0, 0.8]} 
        color={player.color} 
        intensity={2} 
        distance={3} 
      />
    </group>
  )
}

// Contenedor de todas las naves
export default function OtherShips() {
  const { otherPlayers, currentSection } = useAppStore()
  
  // No mostrar otras naves cuando estamos dentro de una sección
  if (currentSection) return null
  
  const players = Array.from(otherPlayers.values())
  
  return (
    <>
      {players.map((player) => (
        <OtherShip key={player.id} player={player} />
      ))}
    </>
  )
}
