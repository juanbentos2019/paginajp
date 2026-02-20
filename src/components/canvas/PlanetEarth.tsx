import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'

// Posición de la Tierra - MUY lejos y difícil de encontrar
const EARTH_POSITION = new THREE.Vector3(2000, -800, -5500)
const EARTH_RADIUS = 25 // Pequeño - apenas visible desde lejos
const TRIGGER_DISTANCE = 80 // Distancia para activar los créditos

// Shader para simular la Tierra
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const earthFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Simplex noise para continentes
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * snoise(p); p *= 2.02;
    f += 0.2500 * snoise(p); p *= 2.03;
    f += 0.1250 * snoise(p); p *= 2.01;
    f += 0.0625 * snoise(p);
    return f;
  }
  
  void main() {
    // Convertir UV a coordenadas esféricas para el mapa
    vec2 sphereUv = vUv;
    sphereUv.x += uTime * 0.01; // Rotación lenta
    
    // Generar continentes con ruido
    float continent = fbm(sphereUv * 4.0);
    continent = smoothstep(0.0, 0.3, continent);
    
    // Colores
    vec3 oceanColor = vec3(0.05, 0.2, 0.5);      // Océano azul profundo
    vec3 oceanShallow = vec3(0.1, 0.4, 0.7);     // Océano superficial
    vec3 landLow = vec3(0.1, 0.4, 0.15);         // Tierra verde
    vec3 landHigh = vec3(0.6, 0.5, 0.3);         // Montañas/desierto
    vec3 snow = vec3(0.95, 0.95, 1.0);           // Nieve/polos
    
    // Mezclar océano
    float oceanDepth = fbm(sphereUv * 8.0) * 0.5 + 0.5;
    vec3 ocean = mix(oceanColor, oceanShallow, oceanDepth);
    
    // Mezclar tierra (elevación)
    float elevation = fbm(sphereUv * 6.0 + 10.0);
    vec3 land = mix(landLow, landHigh, smoothstep(0.3, 0.7, elevation));
    
    // Polos (nieve basada en latitud)
    float latitude = abs(vUv.y - 0.5) * 2.0;
    float polar = smoothstep(0.7, 0.95, latitude);
    
    // Color base
    vec3 baseColor = mix(ocean, land, continent);
    baseColor = mix(baseColor, snow, polar * 0.8);
    
    // Nubes
    float clouds = fbm(sphereUv * 5.0 + uTime * 0.02);
    clouds = smoothstep(0.2, 0.6, clouds) * 0.4;
    baseColor = mix(baseColor, vec3(1.0), clouds);
    
    // Iluminación simple (sol desde un lado)
    vec3 lightDir = normalize(vec3(1.0, 0.5, 0.5));
    float light = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.2;
    
    // Atmósfera (fresnel en los bordes)
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    vec3 atmosphere = vec3(0.3, 0.6, 1.0) * fresnel * 0.5;
    
    // Color final
    vec3 finalColor = baseColor * (ambient + light * 0.8) + atmosphere;
    
    // Lado oscuro (noche) con luces de ciudades
    float nightSide = 1.0 - smoothstep(-0.1, 0.2, dot(vNormal, lightDir));
    float cityLights = continent * fbm(sphereUv * 20.0);
    cityLights = smoothstep(0.5, 0.8, cityLights) * nightSide * 0.5;
    finalColor += vec3(1.0, 0.8, 0.4) * cityLights;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// Shader para la atmósfera
const atmosphereVertexShader = `
  varying vec3 vNormal;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;
    gl_FragColor = vec4(atmosphere, intensity * 0.6);
  }
`

export default function PlanetEarth() {
const { currentSection, isPlayingArcade, earthCreditsActive, startEarthCredits } = useAppStore()
  const [hasTriggered, setHasTriggered] = useState(false)
  
  const earthRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])
  
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
    
    // Rotación del planeta
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02
    }
    
    // Detectar proximidad para activar créditos
    if (!hasTriggered && !earthCreditsActive) {
      const cameraPos = state.camera.position
      const distance = cameraPos.distanceTo(EARTH_POSITION)
      
      if (distance < TRIGGER_DISTANCE) {
        setHasTriggered(true)
        startEarthCredits()
      }
    }
  })
  
  // No renderizar durante sección, arcade o créditos
  if (currentSection || isPlayingArcade || earthCreditsActive) return null
  
  return (
    <group position={EARTH_POSITION.toArray()}>
      {/* Planeta Tierra */}
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={earthVertexShader}
            fragmentShader={earthFragmentShader}
            uniforms={uniforms}
          />
        </mesh>
      </group>
      
      {/* Atmósfera */}
      <mesh scale={1.05}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Luna */}
      <mesh position={[60, 15, 25]}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color="#cccccc" />
      </mesh>
      
      {/* Luz para iluminar */}
      <pointLight position={[150, 50, 150]} intensity={1.5} distance={500} color="#ffffee" />
      
      {/* Label cuando estás cerca - solo visible de cerca */}
      <Billboard position={[0, EARTH_RADIUS + 8, 0]}>
        <Text
          fontSize={4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.5}
          outlineColor="#000000"
        >
          🌍 HOME
        </Text>
      </Billboard>
      
      {/* Mensaje secreto más abajo */}
      <Billboard position={[0, -EARTH_RADIUS - 12, 0]}>
        <Text
          fontSize={2}
          color="#88aaff"
          anchorX="center"
          anchorY="middle"
          maxWidth={60}
        >
          "That's here. That's home."
        </Text>
        <Text
          fontSize={1.5}
          color="#6688aa"
          anchorX="center"
          anchorY="middle"
          position={[0, -4, 0]}
        >
          — Carl Sagan
        </Text>
      </Billboard>
    </group>
  )
}
