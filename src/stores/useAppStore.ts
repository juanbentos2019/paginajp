import { create } from 'zustand'
import * as THREE from 'three'

// Definición de secciones del portfolio
export interface Section {
  id: string
  name: string
  color: string
  geometry: 'box' | 'sphere' | 'octahedron' | 'torus' | 'cone' | 'dodecahedron'
}

export const sections: Section[] = [
  { id: 'about', name: 'Sobre Mí', color: '#6366f1', geometry: 'octahedron' },
  { id: 'projects', name: 'Proyectos', color: '#ec4899', geometry: 'dodecahedron' },
  { id: 'skills', name: 'Habilidades', color: '#14b8a6', geometry: 'torus' },
  { id: 'experience', name: 'Tecnologías', color: '#f59e0b', geometry: 'box' },
  { id: 'contact', name: 'Contacto', color: '#22c55e', geometry: 'sphere' },
]

interface MobileInput {
  lookX: number   // Joystick izquierdo: rotación horizontal
  lookY: number   // Joystick izquierdo: rotación vertical
  moveY: number   // Joystick derecho: adelante/atrás
}

// Sistema de disparos
export interface LaserShot {
  id: string
  origin: THREE.Vector3
  direction: THREE.Vector3
  timestamp: number
  isRemote?: boolean  // Si viene de otro jugador
}

// Jugador remoto
export interface OtherPlayer {
  id: string
  color: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  isProtected: boolean
  lastUpdate: number
}

// Explosión visual
export interface ExplosionData {
  id: string
  position: { x: number; y: number; z: number }
  color: string
  timestamp: number
}

interface AppState {
  currentSection: string | null
  pendingSection: string | null  // Sección a abrir después del warp
  isNavigating: boolean
  isWarping: boolean
  hoveredSection: string | null
  mobileInput: MobileInput
  lasers: LaserShot[]  // Sistema de disparos
  
  // Multiplayer
  playerId: string | null
  roomId: string | null
  isConnected: boolean
  otherPlayers: Map<string, OtherPlayer>
  isDead: boolean
  killedBy: string | null
  explosions: ExplosionData[]  // Explosiones visibles
  respawnPosition: { x: number; y: number; z: number } | null
  nearbyPlanet: { id: string; name: string; color: string; distance: number } | null  // Planeta cercano (warning)
  isThirdPerson: boolean  // Modo de cámara
  
  // Easter Egg: Planeta NUNCA
  neverPlanetCaught: boolean
  neverPlanetCatches: number  // Contador global de Firebase
  neverPlanetStartTime: number | null  // Timestamp de cuando empezó a perseguirlo
  
  // Easter Egg: Arcade Minigame
  isPlayingArcade: boolean
  arcadeScore: number
  arcadeHighScore: number
  arcadeLives: number
  arcadeWave: number
  arcadeGameOver: boolean
  
  // Navigation data
  shipPosition: { x: number; y: number; z: number }
  shipSpeed: number
  
  setCurrentSection: (section: string | null) => void
  setHoveredSection: (section: string | null) => void
  navigateTo: (section: string) => void
  completeWarp: () => void
  goHome: () => void
  setMobileInput: (input: Partial<MobileInput>) => void
  addLaser: (laser: LaserShot) => void
  removeLaser: (id: string) => void
  
  // Multiplayer actions
  setPlayerId: (id: string) => void
  setRoomId: (id: string) => void
  setConnected: (connected: boolean) => void
  updateOtherPlayer: (id: string, player: OtherPlayer) => void
  removeOtherPlayer: (id: string) => void
  addRemoteLaser: (laser: { id: string; playerId: string; origin: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number }; timestamp: number }) => void
  setDead: (dead: boolean, killedBy?: string) => void
  respawn: () => void
  addExplosion: (position: { x: number; y: number; z: number }, color: string) => void
  removeExplosion: (id: string) => void
  clearRespawnPosition: () => void
  setNearbyPlanet: (planet: { id: string; name: string; color: string; distance: number } | null) => void
  toggleCameraView: () => void
  setThirdPerson: (value: boolean) => void
  
  // Easter Egg: Planeta NUNCA actions
  setNeverPlanetCaught: (caught: boolean) => void
  setNeverPlanetCatches: (count: number) => void
  startNeverPlanetChase: () => void
  resetNeverPlanet: () => void
  
  // Easter Egg: Arcade actions
  startArcade: () => void
  exitArcade: () => void
  addArcadeScore: (points: number) => void
  arcadeLoseLife: () => void
  arcadeNextWave: () => void
  resetArcade: () => void
  setArcadeHighScore: (score: number) => void
  
  // Navigation actions
  updateShipData: (position: { x: number; y: number; z: number }, speed: number) => void
  
  // Easter Egg: Earth Credits
  earthCreditsActive: boolean
  earthCreditsPhase: 'credits' | 'rickroll'
  startEarthCredits: () => void
  setEarthCreditsPhase: (phase: 'credits' | 'rickroll') => void
  endEarthCredits: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentSection: null,
  pendingSection: null,
  isNavigating: false,
  isWarping: false,
  hoveredSection: null,
  mobileInput: { lookX: 0, lookY: 0, moveY: 0 },
  lasers: [],
  
  // Multiplayer state
  playerId: null,
  roomId: null,
  isConnected: false,
  otherPlayers: new Map(),
  isDead: false,
  killedBy: null,
  explosions: [],
  respawnPosition: null,
  nearbyPlanet: null,
  isThirdPerson: false,
  
  // Easter Egg: Planeta NUNCA state
  neverPlanetCaught: false,
  neverPlanetCatches: 0,
  neverPlanetStartTime: null,
  
  // Easter Egg: Arcade state
  isPlayingArcade: false,
  arcadeScore: 0,
  arcadeHighScore: 0,
  arcadeLives: 3,
  arcadeWave: 1,
  arcadeGameOver: false,
  
  // Easter Egg: Earth Credits
  earthCreditsActive: false,
  earthCreditsPhase: 'credits' as 'credits' | 'rickroll',
  
  // Navigation data
  shipPosition: { x: 0, y: 0, z: 12 },
  shipSpeed: 0,
  
  setCurrentSection: (section) => set({ currentSection: section }),
  setHoveredSection: (section) => set({ hoveredSection: section }),
  
  // Inicia el warp, guarda la sección pendiente
  navigateTo: (section) => set({ 
    isNavigating: true,
    isWarping: true,
    pendingSection: section
  }),
  
  // Cuando el warp termina, abre la sección
  completeWarp: () => {
    const { pendingSection } = get()
    set({ 
      isWarping: false,
      currentSection: pendingSection,
      pendingSection: null
    })
  },
  
  goHome: () => set({ 
    currentSection: null, 
    pendingSection: null,
    isNavigating: false,
    isWarping: false
  }),
  
  setMobileInput: (input) => set((state) => ({
    mobileInput: { ...state.mobileInput, ...input }
  })),
  
  // Sistema de disparos
  addLaser: (laser) => set((state) => ({
    lasers: [...state.lasers, laser]
  })),
  removeLaser: (id) => set((state) => ({
    lasers: state.lasers.filter(l => l.id !== id)
  })),
  
  // Multiplayer actions
  setPlayerId: (id) => set({ playerId: id }),
  setRoomId: (id) => set({ roomId: id }),
  setConnected: (connected) => set({ isConnected: connected }),
  
  updateOtherPlayer: (id, player) => set((state) => {
    const newPlayers = new Map(state.otherPlayers)
    newPlayers.set(id, player)
    return { otherPlayers: newPlayers }
  }),
  
  removeOtherPlayer: (id) => set((state) => {
    const newPlayers = new Map(state.otherPlayers)
    newPlayers.delete(id)
    return { otherPlayers: newPlayers }
  }),
  
  addRemoteLaser: (laser) => set((state) => {
    // Evitar duplicados
    if (state.lasers.find(l => l.id === laser.id)) return state
    
    const newLaser: LaserShot = {
      id: laser.id,
      origin: new THREE.Vector3(laser.origin.x, laser.origin.y, laser.origin.z),
      direction: new THREE.Vector3(laser.direction.x, laser.direction.y, laser.direction.z),
      timestamp: laser.timestamp,
      isRemote: true
    }
    return { lasers: [...state.lasers, newLaser] }
  }),
  
  setDead: (dead, killedBy) => set({ isDead: dead, killedBy: killedBy || null }),
  
  respawn: () => {
    // Generar posición aleatoria de respawn
    const randomX = (Math.random() - 0.5) * 60
    const randomY = (Math.random() - 0.5) * 40
    const randomZ = (Math.random() - 0.5) * 60
    
    set({ 
      isDead: false, 
      killedBy: null,
      respawnPosition: { x: randomX, y: randomY, z: randomZ }
    })
  },
  
  clearRespawnPosition: () => set({ respawnPosition: null }),
  
  setNearbyPlanet: (planet) => set({ nearbyPlanet: planet }),
  toggleCameraView: () => set((state) => ({ isThirdPerson: !state.isThirdPerson })),
  
  setThirdPerson: (value) => set({ isThirdPerson: value }),
  
  addExplosion: (position, color) => set((state) => ({
    explosions: [...state.explosions, {
      id: `explosion-${Date.now()}-${Math.random()}`,
      position,
      color,
      timestamp: Date.now()
    }]
  })),
  
  removeExplosion: (id) => set((state) => ({
    explosions: state.explosions.filter(e => e.id !== id)
  })),
  
  // Easter Egg: Planeta NUNCA actions
  setNeverPlanetCaught: (caught) => set({ neverPlanetCaught: caught }),
  setNeverPlanetCatches: (count) => set({ neverPlanetCatches: count }),
  startNeverPlanetChase: () => set((state) => ({
    neverPlanetStartTime: state.neverPlanetStartTime || Date.now()
  })),
  resetNeverPlanet: () => set({
    neverPlanetCaught: false,
    neverPlanetStartTime: null
  }),
  
  // Easter Egg: Arcade actions
  startArcade: () => set({
    isPlayingArcade: true,
    arcadeScore: 0,
    arcadeLives: 3,
    arcadeWave: 1,
    arcadeGameOver: false
  }),
  
  exitArcade: () => set({
    isPlayingArcade: false,
    arcadeGameOver: false,
    arcadeScore: 0,
    arcadeLives: 3,
    arcadeWave: 1,
    // Teleportar al punto de inicio
    respawnPosition: { x: 0, y: 0, z: 12 }
  }),
  
  addArcadeScore: (points) => set((state) => ({
    arcadeScore: state.arcadeScore + points
  })),
  
  arcadeLoseLife: () => set((state) => {
    const newLives = state.arcadeLives - 1
    return {
      arcadeLives: newLives,
      arcadeGameOver: newLives <= 0
    }
  }),
  
  arcadeNextWave: () => set((state) => ({
    arcadeWave: state.arcadeWave + 1,
    arcadeScore: state.arcadeScore + 500  // Bonus por completar oleada
  })),
  
  resetArcade: () => set((state) => ({
    arcadeScore: 0,
    arcadeLives: 3,
    arcadeWave: 1,
    arcadeGameOver: false,
    arcadeHighScore: Math.max(state.arcadeHighScore, state.arcadeScore)
  })),
  
  setArcadeHighScore: (score) => set({ arcadeHighScore: score }),
  
  // Easter Egg: Earth Credits actions
  startEarthCredits: () => set({ earthCreditsActive: true, earthCreditsPhase: 'credits' }),
  setEarthCreditsPhase: (phase: 'credits' | 'rickroll') => set({ earthCreditsPhase: phase }),
  endEarthCredits: () => set({ earthCreditsActive: false, earthCreditsPhase: 'credits' }),
  
  // Navigation actions
  updateShipData: (position, speed) => set({ shipPosition: position, shipSpeed: speed }),
}))
