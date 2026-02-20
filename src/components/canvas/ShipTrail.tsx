import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface TrailPoint {
  position: THREE.Vector3
  age: number
  intensity: number
}

const MAX_POINTS = 100
const POINT_LIFETIME = 2.0 // segundos
const SPAWN_INTERVAL = 0.02 // cada 20ms

export default function ShipTrail() {
  const { camera } = useThree()
  const pointsRef = useRef<THREE.Points>(null)
  const trailPoints = useRef<TrailPoint[]>([])
  const lastSpawnTime = useRef(0)
  const isBoosting = useRef(false)
  
  // Detectar si está en boost (shift presionado)
  useFrame(() => {
    // Verificar boost leyendo el estado de la tecla
    const checkBoost = () => {
      // @ts-ignore - accedemos al estado global de keys
      return window.__shipBoost || false
    }
    isBoosting.current = checkBoost()
  })
  
  // Geometría y material para las partículas
  const { positions, colors, sizes } = useMemo(() => {
    return {
      positions: new Float32Array(MAX_POINTS * 3),
      colors: new Float32Array(MAX_POINTS * 3),
      sizes: new Float32Array(MAX_POINTS)
    }
  }, [])
  
  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    const now = state.clock.elapsedTime
    const boost = isBoosting.current
    
    // Spawn nuevos puntos
    if (now - lastSpawnTime.current > SPAWN_INTERVAL) {
      lastSpawnTime.current = now
      
      // Posición detrás de la cámara
      const behindCamera = new THREE.Vector3(0, 0, 1.5)
      behindCamera.applyQuaternion(camera.quaternion)
      behindCamera.add(camera.position)
      
      // Agregar variación para efecto de motor dual
      const offset1 = new THREE.Vector3(0.3, -0.1, 0)
      offset1.applyQuaternion(camera.quaternion)
      
      const offset2 = new THREE.Vector3(-0.3, -0.1, 0)
      offset2.applyQuaternion(camera.quaternion)
      
      // Agregar puntos para cada "motor"
      trailPoints.current.push({
        position: behindCamera.clone().add(offset1),
        age: 0,
        intensity: boost ? 1.5 : 1.0
      })
      
      trailPoints.current.push({
        position: behindCamera.clone().add(offset2),
        age: 0,
        intensity: boost ? 1.5 : 1.0
      })
      
      // Limitar cantidad de puntos
      while (trailPoints.current.length > MAX_POINTS) {
        trailPoints.current.shift()
      }
    }
    
    // Actualizar edad de puntos y remover los viejos
    trailPoints.current = trailPoints.current.filter(point => {
      point.age += delta
      return point.age < POINT_LIFETIME * point.intensity
    })
    
    // Actualizar geometría
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    const colorArray = pointsRef.current.geometry.attributes.color.array as Float32Array
    const sizeArray = pointsRef.current.geometry.attributes.size.array as Float32Array
    
    // Resetear
    posArray.fill(0)
    colorArray.fill(0)
    sizeArray.fill(0)
    
    // Llenar con puntos actuales
    trailPoints.current.forEach((point, i) => {
      if (i >= MAX_POINTS) return
      
      const lifeRatio = 1 - (point.age / (POINT_LIFETIME * point.intensity))
      
      // Posición
      posArray[i * 3] = point.position.x
      posArray[i * 3 + 1] = point.position.y
      posArray[i * 3 + 2] = point.position.z
      
      // Color: de cyan brillante a azul oscuro
      const r = 0.3 * lifeRatio * point.intensity
      const g = 0.6 * lifeRatio * point.intensity
      const b = 1.0 * lifeRatio * point.intensity
      
      colorArray[i * 3] = r
      colorArray[i * 3 + 1] = g
      colorArray[i * 3 + 2] = b
      
      // Tamaño: más grande al principio, se reduce
      sizeArray[i] = lifeRatio * 0.8 * point.intensity
    })
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.color.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            float alpha = smoothstep(0.5, 0.0, dist);
            gl_FragColor = vec4(vColor, alpha * 0.8);
          }
        `}
      />
    </points>
  )
}
