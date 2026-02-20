export interface PlayerPosition {
  x: number
  y: number
  z: number
}

export interface PlayerRotation {
  x: number
  y: number
  z: number
}

export interface Player {
  id: string
  color: string
  position: PlayerPosition
  rotation: PlayerRotation
  isProtected: boolean
  lastUpdate: number
}

export interface LaserData {
  id: string
  playerId: string
  origin: PlayerPosition
  direction: PlayerPosition
  timestamp: number
}

export interface HitData {
  victimId: string
  attackerId: string
  timestamp: number
}

// Colores disponibles para las naves
export const SHIP_COLORS = [
  '#ef4444', // rojo
  '#f97316', // naranja
  '#eab308', // amarillo
  '#22c55e', // verde
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // azul
  '#8b5cf6', // violeta
  '#d946ef', // fucsia
  '#ec4899', // rosa
]
