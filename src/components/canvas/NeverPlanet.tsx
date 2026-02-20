import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'
import { database } from '../../lib/firebase'
import { ref, onValue, runTransaction } from 'firebase/database'

// Configuración del planeta NUNCA
const NEVER_CONFIG = {
  initialPosition: new THREE.Vector3(400, 150, -450),
  detectionRadius: 100,     // Empieza a huir cuando el jugador está a esta distancia
  captureRadius: 8,         // Radio para "ganar" (difícil pero posible)
  maxFleeSpeed: 35,         // Velocidad máxima de huida (nave con boost = 37.5)
  minFleeSpeed: 5,          // Velocidad mínima de huida
  glitchFrequency: 0.015,   // Probabilidad de glitch visual por frame
  boundaryRadius: 800,      // Límite del espacio de juego
}

// Shader para efecto glitch/distorsión
const glitchVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uGlitch;
  
  void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 pos = position;
    
    // Distorsión glitch
    if (uGlitch > 0.5) {
      pos.x += sin(pos.y * 10.0 + uTime * 20.0) * 0.3;
      pos.z += cos(pos.x * 10.0 + uTime * 15.0) * 0.2;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const glitchFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uGlitch;
  uniform float uVisible;
  
  void main() {
    // Color base: negro casi total
    vec3 baseColor = vec3(0.02, 0.02, 0.05);
    
    // Borde sutil con fresnel
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    vec3 edgeColor = vec3(0.15, 0.1, 0.2);
    
    vec3 finalColor = mix(baseColor, edgeColor, fresnel * 0.5);
    
    // Glitch: líneas de escaneo y distorsión de color
    if (uGlitch > 0.5) {
      float scanline = sin(vUv.y * 100.0 + uTime * 50.0) * 0.5 + 0.5;
      finalColor = mix(finalColor, vec3(0.3, 0.0, 0.3), scanline * 0.3);
      
      // Desplazamiento RGB
      finalColor.r += sin(uTime * 30.0) * 0.1;
      finalColor.b += cos(uTime * 25.0) * 0.1;
    }
    
    // Opacidad muy baja para ser casi invisible
    float alpha = mix(0.15, 0.4, fresnel) * uVisible;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export default function NeverPlanet() {
  const planetRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const positionRef = useRef(NEVER_CONFIG.initialPosition.clone())
  const glitchRef = useRef(0)
  const visibleRef = useRef(1)
  
  const { camera } = useThree()
  const { 
    currentSection, 
    isWarping,
    setNeverPlanetCaught,
    setNeverPlanetCatches,
    startNeverPlanetChase,
    neverPlanetCaught
  } = useAppStore()
  
  // Uniforms para el shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGlitch: { value: 0 },
    uVisible: { value: 1 },
  }), [])
  
  // Cargar contador global de Firebase
  useEffect(() => {
    const catchesRef = ref(database, 'neverPlanet/catches')
    
    const unsubscribe = onValue(catchesRef, (snapshot) => {
      const count = snapshot.val() || 0
      setNeverPlanetCatches(count)
    })
    
    return () => unsubscribe()
  }, [setNeverPlanetCatches])
  
  // Incrementar contador en Firebase cuando se captura
  const incrementCatches = async () => {
    const catchesRef = ref(database, 'neverPlanet/catches')
    await runTransaction(catchesRef, (currentCount) => {
      return (currentCount || 0) + 1
    })
  }
  
  // Loop principal
  useFrame((state, delta) => {
    if (!planetRef.current || !materialRef.current) return
    if (currentSection || isWarping || neverPlanetCaught) return
    
    const time = state.clock.elapsedTime
    uniforms.uTime.value = time
    
    // Posición del jugador (cámara)
    const playerPos = camera.position.clone()
    const planetPos = positionRef.current
    
    // Vector del planeta hacia el jugador
    const toPlayer = playerPos.clone().sub(planetPos)
    const distance = toPlayer.length()
    
    // --- COMPORTAMIENTO DE HUIDA ---
    if (distance < NEVER_CONFIG.detectionRadius) {
      // Iniciar tracking de tiempo
      startNeverPlanetChase()
      
      // Dirección de huida (opuesta al jugador)
      const fleeDirection = toPlayer.normalize().negate()
      
      // Velocidad proporcional a la cercanía (más cerca = más rápido)
      const proximityFactor = 1 - (distance / NEVER_CONFIG.detectionRadius)
      const fleeSpeed = THREE.MathUtils.lerp(
        NEVER_CONFIG.minFleeSpeed,
        NEVER_CONFIG.maxFleeSpeed,
        proximityFactor
      )
      
      // Añadir algo de zigzag para hacerlo más interesante
      const zigzag = new THREE.Vector3(
        Math.sin(time * 2) * 0.3,
        Math.cos(time * 1.5) * 0.2,
        Math.sin(time * 1.8) * 0.25
      )
      fleeDirection.add(zigzag).normalize()
      
      // Mover el planeta
      planetPos.addScaledVector(fleeDirection, fleeSpeed * delta)
      
      // Mantener dentro de los límites del espacio
      const distFromCenter = planetPos.length()
      if (distFromCenter > NEVER_CONFIG.boundaryRadius) {
        // Rebotar hacia el centro
        const toCenter = planetPos.clone().normalize().negate()
        planetPos.addScaledVector(toCenter, fleeSpeed * delta * 2)
      }
      
      // Efecto glitch más frecuente cuando está cerca
      if (Math.random() < NEVER_CONFIG.glitchFrequency * (1 + proximityFactor * 3)) {
        glitchRef.current = 1
        setTimeout(() => { glitchRef.current = 0 }, 50 + Math.random() * 100)
      }
      
      // Más visible cuando está cerca (para dar pista al jugador)
      visibleRef.current = THREE.MathUtils.lerp(0.3, 1, proximityFactor * 0.5)
    } else {
      // Glitch aleatorio ocasional cuando está lejos
      if (Math.random() < NEVER_CONFIG.glitchFrequency * 0.3) {
        glitchRef.current = 1
        setTimeout(() => { glitchRef.current = 0 }, 30)
      }
      visibleRef.current = 0.3
    }
    
    // --- DETECCIÓN DE CAPTURA ---
    if (distance < NEVER_CONFIG.captureRadius) {
      console.log('🎉 ¡PLANETA NUNCA CAPTURADO!')
      setNeverPlanetCaught(true)
      incrementCatches()
    }
    
    // Actualizar uniforms
    uniforms.uGlitch.value = glitchRef.current
    uniforms.uVisible.value = visibleRef.current
    
    // Actualizar posición visual
    planetRef.current.position.copy(planetPos)
    
    // Rotación sutil
    planetRef.current.rotation.y += delta * 0.1
    planetRef.current.rotation.x += delta * 0.05
  })
  
  // No renderizar si ya fue capturado o estamos en una sección
  if (neverPlanetCaught) return null
  
  return (
    <group ref={planetRef} position={positionRef.current.toArray()}>
      {/* Esfera principal con shader glitch */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[5, 32, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={glitchVertexShader}
          fragmentShader={glitchFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Aura oscura */}
      <mesh>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial
          color="#0a0010"
          transparent
          opacity={0.1}
        />
      </mesh>
      
      {/* Anillo misterioso */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[7, 0.1, 8, 32]} />
        <meshBasicMaterial
          color="#1a0030"
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Label casi invisible */}
      <Billboard position={[0, -8, 0]}>
        <Text
          fontSize={1.5}
          color="#1a0030"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.15}
        >
          ???
        </Text>
      </Billboard>
      
      {/* Luz muy tenue */}
      <pointLight
        color="#1a0030"
        intensity={0.3}
        distance={15}
        decay={2}
      />
    </group>
  )
}
