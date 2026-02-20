import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LaserProps {
  id: string
  origin: THREE.Vector3
  direction: THREE.Vector3
  onComplete: (id: string) => void
}

const LASER_SPEED = 45  // Más lento para verse como proyectil
const LASER_MAX_DISTANCE = 150
const LASER_LENGTH = 3

export default function Laser({ id, origin, direction, onComplete }: LaserProps) {
  const groupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)
  
  // Memorizar valores iniciales
  const initialData = useMemo(() => {
    const startPos = origin.clone()
    const dir = direction.clone().normalize()
    
    // Calcular rotación para alinear el láser con la dirección
    const quaternion = new THREE.Quaternion()
    // El cilindro por defecto apunta en Y, queremos que apunte en la dirección del disparo
    const up = new THREE.Vector3(0, 1, 0)
    quaternion.setFromUnitVectors(up, dir)
    
    return { startPos, dir, quaternion }
  }, [origin, direction])
  
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    // Mover el láser hacia adelante
    progressRef.current += LASER_SPEED * delta
    
    // Calcular nueva posición
    const currentPos = initialData.startPos.clone().addScaledVector(
      initialData.dir, 
      progressRef.current
    )
    groupRef.current.position.copy(currentPos)
    
    // Remover cuando alcanza distancia máxima
    if (progressRef.current >= LASER_MAX_DISTANCE) {
      onComplete(id)
    }
  })
  
  return (
    <group ref={groupRef} position={origin} quaternion={initialData.quaternion}>
      {/* Núcleo del láser - brillante */}
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, LASER_LENGTH, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Capa media */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, LASER_LENGTH, 6]} />
        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.8} />
      </mesh>
      
      {/* Glow exterior */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, LASER_LENGTH, 6]} />
        <meshBasicMaterial 
          color="#6366f1" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Luz que ilumina el entorno */}
      <pointLight color="#6366f1" intensity={3} distance={5} />
    </group>
  )
}
