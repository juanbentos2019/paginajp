import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'

interface WarpEffectProps {
  active: boolean
  onComplete?: () => void
}

export default function WarpEffect({ active, onComplete }: WarpEffectProps) {
  const meshRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)
  const hasCompletedRef = useRef(false)
  const { camera } = useThree()
  
  const particleCount = 800
  
  // Crear partículas para el efecto warp
  const [positions, velocities, colors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      // Distribuir en un cilindro alrededor de la cámara
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 15
      const z = (Math.random() - 0.5) * 100
      
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.sin(angle) * radius
      positions[i * 3 + 2] = z
      
      // Velocidad aleatoria para variación
      velocities[i] = 0.5 + Math.random() * 1.5
      
      // Colores: mezcla de blanco, azul y violeta
      const colorChoice = Math.random()
      if (colorChoice < 0.5) {
        // Blanco
        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      } else if (colorChoice < 0.8) {
        // Indigo claro
        colors[i * 3] = 0.506
        colors[i * 3 + 1] = 0.549
        colors[i * 3 + 2] = 0.972
      } else {
        // Violeta
        colors[i * 3] = 0.698
        colors[i * 3 + 1] = 0.580
        colors[i * 3 + 2] = 0.996
      }
    }
    
    return [positions, velocities, colors]
  }, [])
  
  // Shader material personalizado para líneas estiradas
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uStretch: { value: 0 },
      },
      vertexShader: `
        attribute float velocity;
        attribute vec3 aColor;
        
        uniform float uProgress;
        uniform float uStretch;
        uniform float uTime;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = aColor;
          
          vec3 pos = position;
          
          // Mover partículas hacia la cámara (Z negativo)
          pos.z += uProgress * velocity * 150.0;
          
          // Wrap around - cuando pasan la cámara, reaparecen atrás
          pos.z = mod(pos.z + 50.0, 100.0) - 50.0;
          
          // Estirar las partículas según el progreso
          float stretch = uStretch * velocity * 2.0;
          
          // Alpha basado en distancia Z
          vAlpha = smoothstep(-50.0, 0.0, pos.z) * smoothstep(10.0, -20.0, pos.z);
          vAlpha *= uProgress;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Tamaño: más grande cuando está más cerca y estirado
          float size = (1.0 + stretch * 3.0) * (50.0 / -mvPosition.z);
          gl_PointSize = clamp(size, 1.0, 30.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Forma de línea estirada
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Gradiente suave
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    const material = meshRef.current.material as THREE.ShaderMaterial
    
    if (active && progressRef.current < 1) {
      // Acelerar hacia el warp
      progressRef.current = Math.min(progressRef.current + delta * 0.8, 1)
      hasCompletedRef.current = false
    } else if (!active && progressRef.current > 0) {
      // Desacelerar
      progressRef.current = Math.max(progressRef.current - delta * 2, 0)
    }
    
    // Llamar onComplete cuando llegamos al máximo
    if (active && progressRef.current >= 0.95 && !hasCompletedRef.current) {
      hasCompletedRef.current = true
      onComplete?.()
    }
    
    // Actualizar uniforms
    material.uniforms.uProgress.value = progressRef.current
    material.uniforms.uStretch.value = progressRef.current * progressRef.current // Easing cuadrático
    material.uniforms.uTime.value = state.clock.elapsedTime
    
    // Posicionar el efecto relativo a la cámara
    meshRef.current.position.copy(camera.position)
    meshRef.current.rotation.copy(camera.rotation)
  })
  
  // No renderizar si no hay progreso
  if (progressRef.current === 0 && !active) return null
  
  return (
    <points ref={meshRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-velocity"
          args={[velocities, 1]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
      </bufferGeometry>
    </points>
  )
}

// Componente contenedor que gestiona el estado del warp
export function WarpContainer() {
  const { isWarping, completeWarp } = useAppStore()
  
  return <WarpEffect active={isWarping} onComplete={completeWarp} />
}
