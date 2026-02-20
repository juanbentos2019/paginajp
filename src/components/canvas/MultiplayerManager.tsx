import { useEffect, useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useMultiplayer } from '../../hooks/useMultiplayer'
import { useAppStore } from '../../stores/useAppStore'
import OtherShips from './OtherShips'
import Explosion from './Explosion'

// Declarar tipo global para shootLaser
declare global {
  interface Window {
    shootLaser?: () => void
  }
}

export default function MultiplayerManager() {
  const { camera } = useThree()
  const { updatePosition, sendLaser, sendHit } = useMultiplayer()
  const { currentSection, lasers, otherPlayers, explosions, removeLaser, addExplosion, removeExplosion } = useAppStore()
  
  const lastLaserCheck = useRef<Set<string>>(new Set())
  
  const handleExplosionComplete = useCallback((id: string) => {
    removeExplosion(id)
  }, [removeExplosion])
  
  // Actualizar posición cada frame
  useFrame(() => {
    const isProtected = currentSection !== null
    
    updatePosition(
      { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
      isProtected
    )
  })
  
  // Interceptar disparos locales para enviarlos al servidor
  useEffect(() => {
    const originalShoot = window.shootLaser
    
    // @ts-ignore
    window.shootLaser = () => {
      // Llamar al disparo original
      originalShoot?.()
      
      // Enviar al servidor
      const direction = new THREE.Vector3(0, 0, -1)
      direction.applyQuaternion(camera.quaternion)
      
      const origin = camera.position.clone()
      origin.addScaledVector(direction, 1.5)
      
      sendLaser(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: direction.x, y: direction.y, z: direction.z }
      )
    }
    
    return () => {
      // @ts-ignore
      window.shootLaser = originalShoot
    }
  }, [camera, sendLaser])
  
  // Detectar colisiones de láseres con otras naves
  useFrame(() => {
    const LASER_SPEED = 45  // Debe coincidir con Laser.tsx
    const HITBOX_RADIUS = 1.8 // Radio ajustado para el modelo 3D más grande
    
    lasers.forEach((laser) => {
      // Solo verificar láseres propios (no remotos)
      if (laser.isRemote) return
      
      // Evitar verificar el mismo láser múltiples veces si ya hizo hit
      if (lastLaserCheck.current.has(laser.id)) return
      
      const laserOrigin = laser.origin.clone()
      const laserDir = laser.direction.clone().normalize()
      
      // Calcular posición actual y anterior del láser
      const elapsed = (Date.now() - laser.timestamp) / 1000
      const currentDistance = elapsed * LASER_SPEED
      const prevDistance = Math.max(0, currentDistance - LASER_SPEED * 0.05) // 50ms atrás
      
      // Verificar colisión con cada nave enemiga
      otherPlayers.forEach((player) => {
        if (player.isProtected) return
        if (lastLaserCheck.current.has(laser.id)) return
        
        const playerPos = new THREE.Vector3(player.position.x, player.position.y, player.position.z)
        
        // Verificar si el láser pasa cerca del jugador usando distancia punto-línea
        // Línea desde origen del láser en dirección del disparo
        const toPlayer = playerPos.clone().sub(laserOrigin)
        const projection = toPlayer.dot(laserDir)
        
        // Solo verificar si el jugador está "adelante" del láser y dentro del rango actual
        if (projection > prevDistance && projection < currentDistance + 5) {
          // Punto más cercano en la línea del láser al jugador
          const closestPoint = laserOrigin.clone().addScaledVector(laserDir, projection)
          const distance = closestPoint.distanceTo(playerPos)
          
          if (distance < HITBOX_RADIUS) {
            console.log('[Multiplayer] 🎯 HIT en', player.id, '! Distancia:', distance.toFixed(2))
            
            // Crear explosión en la posición del jugador
            addExplosion(
              { x: player.position.x, y: player.position.y, z: player.position.z },
              player.color
            )
            
            sendHit(player.id)
            lastLaserCheck.current.add(laser.id)
            removeLaser(laser.id)
          }
        }
      })
    })
    
    // Limpiar set de láseres verificados periódicamente
    if (lastLaserCheck.current.size > 100) {
      lastLaserCheck.current.clear()
    }
  })
  
  return (
    <>
      <OtherShips />
      
      {/* Renderizar explosiones */}
      {explosions.map((explosion) => (
        <Explosion
          key={explosion.id}
          position={new THREE.Vector3(explosion.position.x, explosion.position.y, explosion.position.z)}
          color={explosion.color}
          onComplete={() => handleExplosionComplete(explosion.id)}
        />
      ))}
    </>
  )
}
