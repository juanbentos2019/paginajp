import { Scene } from './components/canvas'
import { Canvas } from '@react-three/fiber'
import MobileControls from './components/ui/MobileControls'
import CockpitHUD from './components/ui/CockpitHUD'
import DeathScreen from './components/ui/DeathScreen'
import NeverPlanetVictory from './components/ui/NeverPlanetVictory'
import ArcadeHUD from './components/ui/ArcadeHUD'
import ArcadeGameOver from './components/ui/ArcadeGameOver'
import RealityGlitch from './components/ui/RealityGlitch'
import NavPanel from './components/ui/NavPanel'
import EarthCredits from './components/ui/EarthCredits'
import './App.css'

function App() {
  return (
    <div className="canvas-container">
      <DeathScreen />
      <NeverPlanetVictory />
      <ArcadeHUD />
      <ArcadeGameOver />
      <CockpitHUD />
      <MobileControls />
      <RealityGlitch />
      <NavPanel />
      <EarthCredits />
      <Canvas
        camera={{ position: [0, 4, 12], fov: 60, near: 0.01, far: 15000 }}
        gl={{
          antialias: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          // Luces físicas y tone mapping cinemático
          // @ts-ignore
          gl.physicallyCorrectLights = true
          // @ts-ignore
          gl.toneMappingExposure = 1.0
          // @ts-ignore
          gl.toneMapping = 3 // ACESFilmicToneMapping

          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            console.log('WebGL context lost, reloading...')
            window.location.reload()
          })
        }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

export default App
