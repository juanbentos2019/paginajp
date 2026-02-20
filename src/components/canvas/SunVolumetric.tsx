import { useMemo, useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Fresnel shader material
const FresnelMaterial = shaderMaterial(
  {
    uBaseColor: new THREE.Color('#4f46e5'),
    uRimColor: new THREE.Color('#a5b4fc'),
    uBias: 0.02,
    uScale: 1.0,
    uPower: 2.0,
    uAlpha: 0.6,
  },
  // vertex
  `
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec3 vViewDir;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      vec4 mvPosition = viewMatrix * worldPos;
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // fragment
  `
    uniform vec3 uBaseColor;
    uniform vec3 uRimColor;
    uniform float uBias;
    uniform float uScale;
    uniform float uPower;
    uniform float uAlpha;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main(){
      float fresnel = uBias + uScale * pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), uPower);
      vec3 color = mix(uBaseColor, uRimColor, fresnel);
      gl_FragColor = vec4(color, uAlpha);
    }
  `
)
extend({ FresnelMaterial })

function createFlareTexture(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grd = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.2, 'rgba(199,210,254,0.8)')
  grd.addColorStop(0.6, 'rgba(99,102,241,0.3)')
  grd.addColorStop(1, 'rgba(99,102,241,0.0)')
  ctx.fillStyle = grd
  ctx.fillRect(0,0,size,size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

import { useAppStore } from '../../stores/useAppStore'
import { useSpring, animated } from '@react-spring/three'

export default function SunVolumetric() {
  const group = useRef<THREE.Group>(null)
  const flareTex = useMemo(() => createFlareTexture(256), [])
  const { currentSection } = useAppStore()

  // OCULTAR completamente cuando hay sección abierta
  const { opacity, lightIntensity } = useSpring({
    opacity: currentSection ? 0 : 1,
    lightIntensity: currentSection ? 0 : 30,
    config: { mass: 1, tension: 180, friction: 22 }
  })

  // Sprites para lens flare básico
  const sprites = useMemo(() => [
    new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: 0xc7d2fe, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })),
    new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: 0x818cf8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })),
    new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: 0x6366f1, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })),
  ], [flareTex])

  useFrame(({ camera }) => {
    if (!group.current) return
    // Vector desde el centro (0,0,0) hacia la cámara en NDC aproximado
    const lightPos = new THREE.Vector3(0,0,0).applyMatrix4(group.current.matrixWorld)
    const toCam = new THREE.Vector3().subVectors(camera.position, lightPos).normalize()
    const basePos = new THREE.Vector3().copy(lightPos)

    // Posicionar sprites a lo largo de la línea light->camera, diferentes distancias
    const distances = [0.15, 0.35, 0.65]
    const sizes = [3.0, 1.8, 1.2]
    for (let i=0;i<sprites.length;i++){
      const s = sprites[i]
      const d = distances[i]
      s.position.copy(basePos).addScaledVector(toCam, d * 10)
      s.scale.setScalar(sizes[i])
    }
  })

  return (
    <animated.group ref={group} visible={opacity.to((v: number) => v > 0.01)}>
      {/* Luz puntual con decaimiento físico */}
      {/* @ts-ignore */}
      <animated.pointLight position={[0,0,0]} intensity={lightIntensity} distance={40} decay={2} color={'#ffffff'} />

      {/* Esfera pequeña con Fresnel - reducida para no tapar texto */}
      <mesh>
        <sphereGeometry args={[0.6, 64, 64]} />
        {/* @ts-ignore */}
        <fresnelMaterial uBaseColor={'#4f46e5'} uRimColor={'#a5b4fc'} uBias={0.02} uScale={1.0} uPower={2.4} uAlpha={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshStandardMaterial emissive={'#6366f1'} emissiveIntensity={1.5} color={'#c7d2fe'} transparent opacity={0.25} />
      </mesh>

      {/* Lens flare sprites */}
      {sprites.map((s, i) => (
        <primitive key={i} object={s} />
      ))}
    </animated.group>
  )
}
