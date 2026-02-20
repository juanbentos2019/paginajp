import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'

// Configuración del planeta arcade secreto
const ARCADE_PLANET_CONFIG = {
  position: new THREE.Vector3(-300, -180, 280),
  activationRadius: 25,  // Radio para activar el minijuego
  warningRadius: 60,     // Radio para mostrar hint
}

// Shader para efecto de estática/TV antigua
const staticVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  
  void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 pos = position;
    
    // Pequeña distorsión
    float noise = sin(pos.y * 20.0 + uTime * 5.0) * 0.02;
    pos += normal * noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const staticFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uProximity;
  
  // Pseudo-random
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    // Efecto de estática de TV
    float staticNoise = random(vUv + uTime * 0.5);
    
    // Líneas de escaneo horizontales
    float scanline = sin(vUv.y * 200.0 + uTime * 10.0) * 0.5 + 0.5;
    
    // Color base: púrpura/magenta retro
    vec3 color1 = vec3(0.6, 0.0, 0.8);  // Púrpura
    vec3 color2 = vec3(0.0, 0.8, 0.8);  // Cyan
    
    // Mezclar colores con patrón
    float pattern = sin(uTime * 2.0 + vUv.x * 10.0) * 0.5 + 0.5;
    vec3 baseColor = mix(color1, color2, pattern);
    
    // Aplicar estática
    baseColor = mix(baseColor, vec3(staticNoise), 0.2);
    
    // Aplicar scanlines
    baseColor *= 0.8 + scanline * 0.2;
    
    // Fresnel para bordes brillantes
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    baseColor += vec3(0.3, 0.1, 0.5) * fresnel;
    
    // Opacidad base muy baja, aumenta con proximidad
    float alpha = mix(0.08, 0.4, uProximity);
    
    // Parpadeo ocasional
    float flicker = step(0.97, random(vec2(uTime * 0.1, 0.0)));
    alpha *= (1.0 - flicker * 0.5);
    
    gl_FragColor = vec4(baseColor, alpha);
  }
`

export default function SecretArcadePlanet() {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const proximityRef = useRef(0)
  const hasActivatedRef = useRef(false)
  
  const { camera } = useThree()
  const { 
    currentSection, 
    isWarping, 
    isPlayingArcade,
    startArcade 
  } = useAppStore()
  
  // Uniforms para el shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProximity: { value: 0 },
  }), [])
  
  useFrame((state, delta) => {
    if (!groupRef.current || !materialRef.current) return
    if (currentSection || isWarping || isPlayingArcade) return
    
    const time = state.clock.elapsedTime
    uniforms.uTime.value = time
    
    // Calcular distancia al jugador
    const playerPos = camera.position
    const planetPos = ARCADE_PLANET_CONFIG.position
    const distance = playerPos.distanceTo(planetPos)
    
    // Proximidad normalizada (0 = lejos, 1 = muy cerca)
    const proximity = Math.max(0, 1 - distance / ARCADE_PLANET_CONFIG.warningRadius)
    proximityRef.current = proximity
    uniforms.uProximity.value = proximity
    
    // Activar minijuego si está muy cerca (solo una vez)
    if (distance < ARCADE_PLANET_CONFIG.activationRadius && !hasActivatedRef.current) {
      hasActivatedRef.current = true
      console.log('🎮 ¡Entrando al Arcade Secreto!')
      startArcade()
    }
    
    // Reset flag cuando se aleja
    if (distance > ARCADE_PLANET_CONFIG.activationRadius * 2) {
      hasActivatedRef.current = false
    }
    
    // Rotación y flotación
    groupRef.current.rotation.y += delta * 0.3
    groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
    groupRef.current.position.y = ARCADE_PLANET_CONFIG.position.y + Math.sin(time * 0.8) * 2
  })
  
  // No renderizar si está en sección, warp o jugando arcade
  if (currentSection || isWarping || isPlayingArcade) return null
  
  return (
    <group 
      ref={groupRef} 
      position={ARCADE_PLANET_CONFIG.position.toArray()}
    >
      {/* Esfera principal con shader de estática */}
      <mesh>
        <icosahedronGeometry args={[8, 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={staticVertexShader}
          fragmentShader={staticFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Anillos de arcade retro */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 0.3, 8, 32]} />
        <meshBasicMaterial
          color="#ff00ff"
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[10, 0.2, 8, 32]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.1}
        />
      </mesh>
      
      {/* Icono de joystick/gamepad (simplificado) */}
      <group position={[0, 0, 9]}>
        {/* Base del joystick */}
        <mesh>
          <cylinderGeometry args={[2, 2.5, 1, 8]} />
          <meshBasicMaterial color="#330066" transparent opacity={0.3} />
        </mesh>
        {/* Palanca */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 2, 8]} />
          <meshBasicMaterial color="#ff00ff" transparent opacity={0.4} />
        </mesh>
        {/* Bola */}
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
        </mesh>
      </group>
      
      {/* Label */}
      <Billboard position={[0, -12, 0]}>
        <Text
          fontSize={2}
          color="#ff00ff"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.2}
          outlineWidth={0.05}
          outlineColor="#00ffff"
        >
          ??? ARCADE ???
        </Text>
      </Billboard>
      
      {/* Hint cuando está cerca */}
      {proximityRef.current > 0.3 && (
        <Billboard position={[0, 15, 0]}>
          <Text
            fontSize={1.5}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
            fillOpacity={proximityRef.current}
          >
            [ ACÉRCATE ]
          </Text>
        </Billboard>
      )}
      
      {/* Luces retro */}
      <pointLight color="#ff00ff" intensity={1} distance={30} decay={2} />
      <pointLight color="#00ffff" intensity={0.5} distance={20} decay={2} position={[5, 5, 5]} />
    </group>
  )
}
