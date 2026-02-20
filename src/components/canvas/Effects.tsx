import { EffectComposer, Vignette, ChromaticAberration, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useAppStore } from '../../stores/useAppStore'

export default function Effects() {
  const { currentSection } = useAppStore()
  
  // Intensidad directa sin animación para evitar errores
  const bloomIntensity = currentSection ? 0 : 0.35

  return (
    <EffectComposer>
      {/* Bloom sutil */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.9}
      />

      {/* Viñeta cinematográfica */}
      <Vignette offset={0.35} darkness={0.5} blendFunction={BlendFunction.NORMAL} />

      {/* Aberración cromática muy sutil */}
      <ChromaticAberration
        offset={new Vector2(0.0002, 0.0002)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0.5}
      />
    </EffectComposer>
  )
}
