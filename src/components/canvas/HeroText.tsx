import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text3D, Center, Float } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { useAppStore } from '../../stores/useAppStore'
import type { Group } from 'three'

// URL de fuente JSON para Text3D
const fontUrl = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json'

export default function HeroText() {
  const groupRef = useRef<Group>(null)
  const { currentSection, isNavigating, isWarping } = useAppStore()
  
  // Ocultar durante warp, navegación o sección abierta
  const isHidden = isNavigating || isWarping || !!currentSection
  
  // Animación de entrada/salida - desaparece completamente
  const { scale, positionY } = useSpring({
    scale: isHidden ? 0 : 1,
    positionY: isHidden ? -2 : 0,
    config: isHidden 
      ? { mass: 1, tension: 280, friction: 20 }  // Rápido al ocultar
      : { mass: 1, tension: 170, friction: 26 }  // Suave al mostrar
  })
  
  useFrame((state) => {
    if (groupRef.current && !isHidden) {
      // Rotación sutil para mostrar que es 3D
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.03
    }
  })
  
  return (
    <animated.group scale={scale} position-y={positionY}>
      <Float
        speed={1.5}
        rotationIntensity={0.02}
        floatIntensity={0.15}
      >
        <group ref={groupRef} position={[0, 0, 0]}>
          {/* Nombre principal en 3D - grande y claro */}
          <Center position={[0, 0.3, 0]}>
            <Text3D
              font={fontUrl}
              size={0.9}
              height={0.25}
              bevelEnabled
              bevelThickness={0.04}
              bevelSize={0.025}
              bevelSegments={5}
            >
              JUAN B.
              <meshStandardMaterial 
                color="#ffffff"
                emissive="#818cf8"
                emissiveIntensity={0.3}
                metalness={0.6}
                roughness={0.2}
              />
            </Text3D>
          </Center>
          
          {/* Línea decorativa minimalista */}
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[3.2, 0.015, 0.04]} />
            <meshStandardMaterial 
              color="#6366f1"
              emissive="#6366f1"
              emissiveIntensity={1.0}
              metalness={0.8}
              roughness={0.1}
            />
          </mesh>
          
          {/* Subtítulo - limpio y legible */}
          <Center position={[0, -0.65, 0]}>
            <Text3D
              font={fontUrl}
              size={0.22}
              height={0.04}
              bevelEnabled
              bevelThickness={0.008}
              bevelSize={0.006}
              bevelSegments={3}
            >
              CREATIVE DEVELOPER
              <meshStandardMaterial 
                color="#e0e0e0"
                emissive="#a5b4fc"
                emissiveIntensity={0.15}
                metalness={0.4}
                roughness={0.3}
              />
            </Text3D>
          </Center>
        </group>
      </Float>
    </animated.group>
  )
}
