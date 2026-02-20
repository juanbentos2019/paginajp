import { useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'
import Laser from './Laser'

export default function LaserSystem() {
  const { camera } = useThree()
  const { currentSection, isWarping, lasers, addLaser, removeLaser } = useAppStore()
  
  // Función para disparar
  const shoot = useCallback(() => {
    if (currentSection || isWarping) return
    
    const origin = camera.position.clone()
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(camera.quaternion)
    
    // Mover origen adelante para que no salga desde dentro
    origin.addScaledVector(direction, 1.5)
    
    const laser = {
      id: `laser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      origin,
      direction,
      timestamp: Date.now(),
    }
    
    addLaser(laser)
  }, [camera, currentSection, isWarping, addLaser])
  
  // Keyboard: Espacio para disparar
  useEffect(() => {
    let lastShot = 0
    const COOLDOWN = 10000 // 10 segundos entre disparos
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const now = Date.now()
        if (now - lastShot >= COOLDOWN) {
          e.preventDefault()
          shoot()
          lastShot = now
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shoot])
  
  // Exponer función shoot para botón mobile
  useEffect(() => {
    // @ts-ignore - Exponer globalmente para mobile
    window.shootLaser = shoot
    return () => {
      // @ts-ignore
      delete window.shootLaser
    }
  }, [shoot])
  
  const handleLaserComplete = useCallback((id: string) => {
    removeLaser(id)
  }, [removeLaser])
  
  return (
    <>
      {lasers.map((laser) => (
        <Laser
          key={laser.id}
          id={laser.id}
          origin={laser.origin}
          direction={laser.direction}
          onComplete={handleLaserComplete}
        />
      ))}
    </>
  )
}
