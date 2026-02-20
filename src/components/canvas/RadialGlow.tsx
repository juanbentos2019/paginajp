import { AdditiveBlending, Color } from 'three'
import { Hud, shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { MathUtils } from 'three'

// Shader para glow radial suave - se expande infinitamente hacia los bordes
const RadialGlowMaterial = shaderMaterial(
  {
    uColor1: new Color('#6366f1'),
    uColor2: new Color('#312e81'),
    uIntensity: 0.3,
    uTime: 0,
  },
  // vertex
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment - gradiente suave con múltiples capas
  `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uIntensity;
    uniform float uTime;
    varying vec2 vUv;
    
    void main() {
      vec2 center = vec2(0.5);
      float dist = distance(vUv, center);
      
      // Capa principal - decay muy suave (cubre toda la pantalla)
      float glow1 = exp(-dist * 2.5) * 0.6;
      
      // Capa secundaria - más concentrada en el centro
      float glow2 = exp(-dist * 5.0) * 0.4;
      
      // Capa de pulso sutil
      float pulse = sin(uTime * 0.5) * 0.05 + 1.0;
      
      // Mezcla de colores basada en distancia
      vec3 col = mix(uColor1, uColor2, dist * 1.5);
      
      // Intensidad final
      float alpha = (glow1 + glow2) * uIntensity * pulse;
      
      gl_FragColor = vec4(col * alpha, alpha * 0.7);
    }
  `
)
extend({ RadialGlowMaterial })

export default function RadialGlow() {
  const matRef = useRef<any>(null)
  const { currentSection } = useAppStore()
  const targetIntensity = currentSection ? 0 : 0.35

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uIntensity = MathUtils.lerp(matRef.current.uIntensity, targetIntensity, 0.08)
      matRef.current.uTime = state.clock.elapsedTime
    }
  })

  return (
    <Hud renderPriority={1}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        {/* @ts-ignore */}
        <radialGlowMaterial
          ref={matRef}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          uColor1={'#818cf8'}
          uColor2={'#312e81'}
          uIntensity={0.35}
        />
      </mesh>
    </Hud>
  )
}
