import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shader para generar estrellas procedurales en el fondo
const starVertexShader = `
  varying vec3 vPosition;
  
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const starFragmentShader = `
  varying vec3 vPosition;
  
  // Hash function para generar pseudo-random
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  // Función para generar estrellas
  float stars(vec3 p, float density) {
    vec3 gridPos = floor(p * density);
    vec3 localPos = fract(p * density) - 0.5;
    
    float star = 0.0;
    
    // Revisar celdas vecinas para suavizar
    for(int x = -1; x <= 1; x++) {
      for(int y = -1; y <= 1; y++) {
        for(int z = -1; z <= 1; z++) {
          vec3 offset = vec3(float(x), float(y), float(z));
          vec3 cellPos = gridPos + offset;
          
          float h = hash(cellPos);
          
          // Solo algunas celdas tienen estrellas
          if(h > 0.97) {
            // Posición de la estrella dentro de la celda
            vec3 starPos = vec3(
              hash(cellPos + vec3(1.0, 0.0, 0.0)),
              hash(cellPos + vec3(0.0, 1.0, 0.0)),
              hash(cellPos + vec3(0.0, 0.0, 1.0))
            ) - 0.5;
            
            vec3 toStar = localPos - offset - starPos;
            float dist = length(toStar);
            
            // Brillo de la estrella (más pequeña = más brillante)
            float brightness = hash(cellPos + vec3(3.0)) * 0.5 + 0.5;
            float size = 0.02 + hash(cellPos + vec3(5.0)) * 0.03;
            
            star += brightness * smoothstep(size, 0.0, dist);
          }
        }
      }
    }
    
    return star;
  }
  
  void main() {
    vec3 dir = normalize(vPosition);
    
    // Múltiples capas de estrellas a diferentes densidades
    float starField = 0.0;
    starField += stars(dir, 50.0) * 1.0;   // Estrellas cercanas brillantes
    starField += stars(dir, 100.0) * 0.6;  // Estrellas medianas
    starField += stars(dir, 200.0) * 0.3;  // Estrellas lejanas tenues
    
    // Fondo NEGRO puro, solo estrellas blancas
    vec3 color = vec3(0.0, 0.0, 0.0);
    
    // Estrellas blancas puras
    color += vec3(1.0) * starField;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export default function StarSkybox() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const uniforms = useMemo(() => ({}), [])
  
  // La esfera sigue la cámara para que siempre esté centrada
  useFrame(({ camera }) => {
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position)
    }
  })
  
  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[10000, 32, 32]} />
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
