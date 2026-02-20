import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'

// Configuración del evento
const CONFIG = {
  intervalMinutes: 3,
  visibleDuration: 15,
  warpDuration: 1.5,
  shipDistance: 400,         // Muy lejos
  shipSpeed: 15,
}

type EventState = 'idle' | 'cruising' | 'warping'

export default function PassingShip() {
  const { currentSection, isPlayingArcade } = useAppStore()
  
  const [eventState, setEventState] = useState<EventState>('idle')
  const [eventProgress, setEventProgress] = useState(0)
  
  const shipRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Points>(null)
  
  // Trayectoria aleatoria
  const trajectory = useMemo(() => {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 0.4 + Math.PI * 0.3
    
    const startPos = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * CONFIG.shipDistance,
      (Math.random() - 0.5) * 100,
      Math.cos(phi) * CONFIG.shipDistance
    )
    
    // Dirección que cruza el espacio visible
    const endOffset = new THREE.Vector3(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 50,
      -CONFIG.shipDistance
    )
    
    const direction = endOffset.clone().sub(startPos).normalize()
    
    return { startPos, direction }
  }, [eventState === 'cruising'])
  
  // Posiciones del trail (estela tipo cometa)
  const trailPositions = useMemo(() => {
    return new Float32Array(30 * 3) // 30 puntos
  }, [])
  
  // Timer para eventos
  useEffect(() => {
    const initialDelay = setTimeout(() => {
      if (!currentSection && !isPlayingArcade) {
        setEventState('cruising')
        setEventProgress(0)
      }
    }, 30000)
    
    const interval = setInterval(() => {
      if (!currentSection && !isPlayingArcade) {
        setEventState('cruising')
        setEventProgress(0)
      }
    }, CONFIG.intervalMinutes * 60 * 1000)
    
    return () => {
      clearTimeout(initialDelay)
      clearInterval(interval)
    }
  }, [currentSection, isPlayingArcade])
  
  useFrame((_, delta) => {
    if (eventState === 'idle' || currentSection || isPlayingArcade) return
    
    setEventProgress(prev => prev + delta)
    
    const { startPos, direction } = trajectory
    
    // === Fase crucero ===
    if (eventState === 'cruising') {
      if (shipRef.current) {
        const pos = startPos.clone().addScaledVector(direction, CONFIG.shipSpeed * eventProgress)
        shipRef.current.position.copy(pos)
        shipRef.current.lookAt(pos.clone().add(direction))
      }
      
      // Actualizar trail
      if (trailRef.current && shipRef.current) {
        const positions = trailRef.current.geometry.attributes.position.array as Float32Array
        const shipPos = shipRef.current.position
        
        // Mover puntos hacia atrás
        for (let i = positions.length - 3; i >= 3; i -= 3) {
          positions[i] = positions[i - 3]
          positions[i + 1] = positions[i - 2]
          positions[i + 2] = positions[i - 1]
        }
        
        // Nuevo punto en la posición actual
        positions[0] = shipPos.x
        positions[1] = shipPos.y
        positions[2] = shipPos.z
        
        trailRef.current.geometry.attributes.position.needsUpdate = true
      }
      
      if (eventProgress >= CONFIG.visibleDuration) {
        setEventState('warping')
        setEventProgress(0)
      }
    }
    
    // === Fase warp (destello y desaparece) ===
    else if (eventState === 'warping') {
      if (shipRef.current) {
        const t = eventProgress / CONFIG.warpDuration
        const acceleration = Math.pow(t, 2) * 1000
        
        const currentPos = shipRef.current.position.clone()
        const pos = currentPos.addScaledVector(direction, acceleration * delta * 60)
        shipRef.current.position.copy(pos)
        
        // Estirar y desvanecer
        const stretch = 1 + t * 20
        shipRef.current.scale.set(1 - t * 0.5, 1 - t * 0.5, stretch)
      }
      
      if (eventProgress >= CONFIG.warpDuration) {
        setEventState('idle')
        setEventProgress(0)
        if (shipRef.current) {
          shipRef.current.scale.set(1, 1, 1)
        }
        // Limpiar trail
        if (trailRef.current) {
          const positions = trailRef.current.geometry.attributes.position.array as Float32Array
          positions.fill(0)
          trailRef.current.geometry.attributes.position.needsUpdate = true
        }
      }
    }
  })
  
  if (currentSection || isPlayingArcade) return null
  
  const isVisible = eventState !== 'idle'
  
  return (
    <group>
      {/* Nave lejana (pequeña, como punto brillante) */}
      <group ref={shipRef} visible={isVisible}>
        {/* Núcleo brillante */}
        <mesh>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        
        {/* Halo */}
        <mesh>
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color="#aaccff" transparent opacity={0.3} />
        </mesh>
        
        {/* Luz */}
        <pointLight color="#aaccff" intensity={8} distance={100} />
      </group>
      
      {/* Estela tipo cometa */}
      <points ref={trailRef} visible={isVisible}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.5}
          color="#aaccff"
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
