import { useEffect, useRef, useCallback } from 'react'
import { ref, set, onValue, remove, onDisconnect, get } from 'firebase/database'
import { database } from '../lib/firebase'
import { useAppStore } from '../stores/useAppStore'
import { SHIP_COLORS } from '../types/multiplayer'
import type { Player, LaserData } from '../types/multiplayer'

const MAX_PLAYERS_PER_ROOM = 10
const POSITION_UPDATE_INTERVAL = 50 // ms (20 updates/segundo)
const PLAYER_TIMEOUT = 2000 // ms - remover jugadores inactivos (2 segundos)

export function useMultiplayer() {
  const { 
    playerId, 
    roomId, 
    setPlayerId, 
    setRoomId, 
    setConnected,
    updateOtherPlayer,
    removeOtherPlayer,
    addRemoteLaser,
    setDead,
    respawnPosition,
    clearRespawnPosition
  } = useAppStore()
  
  const lastUpdateTime = useRef(0)
  const positionRef = useRef({ x: 0, y: 0, z: 12 })
  const rotationRef = useRef({ x: 0, y: 0, z: 0 })
  const isProtectedRef = useRef(false)
  const playerColorRef = useRef(SHIP_COLORS[Math.floor(Math.random() * SHIP_COLORS.length)])
  const joinedRoomRef = useRef<string | null>(null)
  
  // Generar ID único para el jugador
  useEffect(() => {
    if (!playerId) {
      const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      console.log('[Multiplayer] Generando playerId:', id)
      setPlayerId(id)
    }
  }, [playerId, setPlayerId])
  
  // Buscar sala disponible y conectar
  useEffect(() => {
    if (!playerId || joinedRoomRef.current) return
    
    const findAndJoinRoom = async () => {
      console.log('[Multiplayer] Buscando sala...')
      
      // Buscar salas existentes
      for (let i = 1; i <= 10; i++) {
        const roomName = `room-${i}`
        const roomPlayersRef = ref(database, `rooms/${roomName}/players`)
        
        try {
          const snapshot = await get(roomPlayersRef)
          const players = snapshot.val() || {}
          const playerCount = Object.keys(players).length
          
          console.log(`[Multiplayer] ${roomName}: ${playerCount} jugadores`)
          
          if (playerCount < MAX_PLAYERS_PER_ROOM) {
            // Unirse a esta sala
            await joinRoom(roomName)
            return
          }
        } catch (error) {
          console.error('[Multiplayer] Error buscando sala:', error)
        }
      }
      
      // Si todas las salas están llenas, jugar solo
      console.log('[Multiplayer] Todas las salas llenas, jugando en modo solo')
      setConnected(true)
    }
    
    const joinRoom = async (room: string) => {
      const playerRef = ref(database, `rooms/${room}/players/${playerId}`)
      
      // Configurar datos iniciales del jugador
      const playerData: Player = {
        id: playerId,
        color: playerColorRef.current,
        position: { x: 0, y: 0, z: 12 },
        rotation: { x: 0, y: 0, z: 0 },
        isProtected: false,
        lastUpdate: Date.now()
      }
      
      try {
        await set(playerRef, playerData)
        
        // Eliminar jugador cuando se desconecte
        onDisconnect(playerRef).remove()
        
        joinedRoomRef.current = room
        setRoomId(room)
        setConnected(true)
        console.log(`[Multiplayer] ✅ Conectado a ${room} como ${playerId} (color: ${playerColorRef.current})`)
      } catch (error) {
        console.error('[Multiplayer] Error uniendose a sala:', error)
      }
    }
    
    findAndJoinRoom()
    
    // Cleanup al desmontar
    return () => {
      if (joinedRoomRef.current && playerId) {
        console.log('[Multiplayer] Desconectando...')
        const playerRef = ref(database, `rooms/${joinedRoomRef.current}/players/${playerId}`)
        remove(playerRef)
        joinedRoomRef.current = null
      }
    }
  }, [playerId, setRoomId, setConnected])
  
  // Escuchar cambios en otros jugadores - usa roomId del store como dependencia
  useEffect(() => {
    if (!roomId || !playerId) {
      console.log('[Multiplayer] Esperando roomId y playerId...', { roomId, playerId })
      return
    }
    
    console.log(`[Multiplayer] 👂 Escuchando jugadores en ${roomId}`)
    const playersRef = ref(database, `rooms/${roomId}/players`)
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const players = snapshot.val() || {}
      const now = Date.now()
      const activeOtherPlayers: string[] = []
      
      Object.entries(players).forEach(([id, data]) => {
        if (id === playerId) return // Ignorar nuestro propio jugador
        
        const player = data as Player
        
        // Verificar si el jugador está activo
        if (now - player.lastUpdate > PLAYER_TIMEOUT) {
          console.log(`[Multiplayer] Jugador ${id} inactivo (${now - player.lastUpdate}ms), removiendo...`)
          removeOtherPlayer(id)
          const inactiveRef = ref(database, `rooms/${roomId}/players/${id}`)
          remove(inactiveRef)
        } else {
          activeOtherPlayers.push(id)
          updateOtherPlayer(id, player)
        }
      })
      
      // Limpiar jugadores que ya no están en Firebase
      const currentOtherPlayers = useAppStore.getState().otherPlayers
      currentOtherPlayers.forEach((_, id) => {
        if (!players[id]) {
          console.log(`[Multiplayer] Jugador ${id} ya no existe en Firebase, removiendo localmente...`)
          removeOtherPlayer(id)
        }
      })
      
      // Log solo cuando cambia el número de jugadores
      const totalPlayers = Object.keys(players).length
      if (activeOtherPlayers.length !== currentOtherPlayers.size) {
        console.log(`[Multiplayer] Jugadores: ${totalPlayers} total, ${activeOtherPlayers.length} otros activos`)
      }
    })
    
    return () => {
      console.log('[Multiplayer] Dejando de escuchar jugadores')
      unsubscribe()
    }
  }, [roomId, playerId, updateOtherPlayer, removeOtherPlayer])
  
  // Escuchar disparos de otros jugadores
  useEffect(() => {
    if (!roomId || !playerId) return
    
    const lasersRef = ref(database, `rooms/${roomId}/lasers`)
    
    const unsubscribe = onValue(lasersRef, (snapshot) => {
      const lasers = snapshot.val() || {}
      
      Object.entries(lasers).forEach(([id, data]) => {
        const laser = data as LaserData
        
        // Ignorar nuestros propios disparos
        if (laser.playerId === playerId) return
        
        // Agregar láser remoto
        addRemoteLaser(laser)
        
        // Limpiar láser después de 2 segundos
        setTimeout(() => {
          const laserRef = ref(database, `rooms/${roomId}/lasers/${id}`)
          remove(laserRef)
        }, 2000)
      })
    })
    
    return () => unsubscribe()
  }, [roomId, playerId, addRemoteLaser])
  
  // Escuchar hits
  useEffect(() => {
    if (!roomId || !playerId) return
    
    const hitsRef = ref(database, `rooms/${roomId}/hits/${playerId}`)
    
    const unsubscribe = onValue(hitsRef, async (snapshot) => {
      const hit = snapshot.val()
      
      if (hit && !isProtectedRef.current) {
        console.log('[Multiplayer] ¡Fuiste eliminado por', hit.attackerId, '!')
        
        // Eliminar este jugador de Firebase inmediatamente
        const playerRef = ref(database, `rooms/${roomId}/players/${playerId}`)
        await remove(playerRef)
        console.log('[Multiplayer] Jugador eliminado de Firebase por muerte')
        
        // Limpiar el hit
        await remove(hitsRef)
        
        // Marcar como muerto en el estado local
        setDead(true, hit.attackerId)
      }
    })
    
    return () => unsubscribe()
  }, [roomId, playerId, setDead])
  
  // Manejar respawn - volver a registrar en Firebase
  useEffect(() => {
    if (!respawnPosition || !playerId || !roomId) return
    
    const respawnPlayer = async () => {
      console.log('[Multiplayer] Respawneando en posición:', respawnPosition)
      
      const playerRef = ref(database, `rooms/${roomId}/players/${playerId}`)
      
      const playerData: Player = {
        id: playerId,
        color: playerColorRef.current,
        position: respawnPosition,
        rotation: { x: 0, y: 0, z: 0 },
        isProtected: true, // Protegido brevemente al respawnear
        lastUpdate: Date.now()
      }
      
      try {
        await set(playerRef, playerData)
        onDisconnect(playerRef).remove()
        console.log('[Multiplayer] ✅ Respawn exitoso')
        clearRespawnPosition()
      } catch (error) {
        console.error('[Multiplayer] Error en respawn:', error)
      }
    }
    
    respawnPlayer()
  }, [respawnPosition, playerId, roomId, clearRespawnPosition])
  
  // Actualizar posición en Firebase
  const updatePosition = useCallback((position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }, isProtected: boolean) => {
    const currentRoom = joinedRoomRef.current
    if (!currentRoom || !playerId) return
    
    const now = Date.now()
    if (now - lastUpdateTime.current < POSITION_UPDATE_INTERVAL) return
    
    lastUpdateTime.current = now
    positionRef.current = position
    rotationRef.current = rotation
    isProtectedRef.current = isProtected
    
    const playerRef = ref(database, `rooms/${currentRoom}/players/${playerId}`)
    set(playerRef, {
      id: playerId,
      color: playerColorRef.current,
      position,
      rotation,
      isProtected,
      lastUpdate: now
    })
  }, [playerId])
  
  // Enviar disparo
  const sendLaser = useCallback((origin: { x: number, y: number, z: number }, direction: { x: number, y: number, z: number }) => {
    const currentRoom = joinedRoomRef.current
    if (!currentRoom || !playerId) return
    
    const laserId = `laser-${playerId}-${Date.now()}`
    const laserRef = ref(database, `rooms/${currentRoom}/lasers/${laserId}`)
    
    const laserData: LaserData = {
      id: laserId,
      playerId,
      origin,
      direction,
      timestamp: Date.now()
    }
    
    set(laserRef, laserData)
  }, [playerId])
  
  // Reportar hit a otro jugador
  const sendHit = useCallback((victimId: string) => {
    const currentRoom = joinedRoomRef.current
    if (!currentRoom || !playerId) return
    
    const hitRef = ref(database, `rooms/${currentRoom}/hits/${victimId}`)
    
    set(hitRef, {
      attackerId: playerId,
      timestamp: Date.now()
    })
  }, [playerId])
  
  return {
    playerId,
    roomId,
    updatePosition,
    sendLaser,
    sendHit
  }
}
