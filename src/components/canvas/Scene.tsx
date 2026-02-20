import NavShapes from './NavShapes'
import Particles from './Particles'
import HeroText from './HeroText'
import Effects from './Effects'
import SectionPanel from './SectionPanel'
import RadialGlow from './RadialGlow'
import { WarpContainer } from './WarpEffect'
import Ship from './Ship'
import PlanetEnvironment from './PlanetEnvironment'
import LaserSystem from './LaserSystem'
import MultiplayerManager from './MultiplayerManager'
import ProjectsSection from './ProjectsSection'
import ShipTrail from './ShipTrail'
import NeverPlanet from './NeverPlanet'
import SecretArcadePlanet from './SecretArcadePlanet'
import GalagaGame from './GalagaGame'
import PassingShip from './PassingShip'
import PlanetEarth from './PlanetEarth'
import StarSkybox from './StarSkybox'
import { Selection } from '@react-three/postprocessing'
import { useAppStore } from '../../stores/useAppStore'

// Espacio exterior (visible cuando NO hay sección activa)
function OuterSpace() {
  const { currentSection, isWarping } = useAppStore()
  const isVisible = !currentSection && !isWarping
  
  if (!isVisible) return null
  
  return (
    <group>
      {/* Iluminación global del espacio */}
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} />
      <directionalLight position={[-10, -5, -10]} intensity={0.2} />
      
      {/* Luz central que ilumina el texto - punto focal */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#ffffff" distance={20} decay={2} />
      <pointLight position={[0, 2, 0]} intensity={1.5} color="#a5b4fc" distance={15} decay={2} />
      
      {/* Luces de acento para los planetas */}
      <pointLight position={[-12, 5, -8]} intensity={0.8} color="#ec4899" distance={30} />
      <pointLight position={[12, -5, -8]} intensity={0.8} color="#14b8a6" distance={30} />
      <pointLight position={[0, 10, 5]} intensity={0.5} color="#f59e0b" distance={25} />
      
      {/* Fondo del espacio */}
      <color attach="background" args={['#010104']} />
      
      {/* Partículas de fondo (estrellas) */}
      <Particles count={2000} />
      
      {/* Nombre central en el origen */}
      <HeroText />
      
      {/* Planetas/Secciones en posiciones fijas */}
      <NavShapes />
      
      {/* Glow radial puro */}
      <RadialGlow />
    </group>
  )
}

export default function Scene() {
  return (
    <Selection>
      {/* Skybox de estrellas - siempre visible en todas direcciones */}
      <StarSkybox />
      
      {/* ESPACIO EXTERIOR - visible cuando exploramos */}
      <OuterSpace />
      
      {/* AMBIENTE DEL PLANETA - visible cuando entramos a una sección */}
      <PlanetEnvironment />
      
      {/* Panel de sección activa (dentro del ambiente) */}
      <SectionPanel />
      
      {/* Sección de proyectos con satélites interactivos */}
      <ProjectsSection />
      
      {/* Efecto Warp Drive (transición) */}
      <WarpContainer />
      
      {/* Nave del jugador (siempre visible) */}
      <Ship />
      
      {/* Estela de la nave */}
      <ShipTrail />
      
      {/* Sistema de disparos */}
      <LaserSystem />
      
      {/* Sistema Multijugador */}
      <MultiplayerManager />
      
      {/* Easter Egg: Planeta NUNCA */}
      <NeverPlanet />
      
      {/* Easter Egg: Planeta Arcade Secreto */}
      <SecretArcadePlanet />
      
      {/* Minijuego Galaga (cuando está activo) */}
      <GalagaGame />
      
      {/* Nave pasajera ambiental */}
      <PassingShip />
      
      {/* Easter Egg: Planeta Tierra a 5000 unidades */}
      <PlanetEarth />
      
      {/* Post-processing */}
      <Effects />
    </Selection>
  )
}
