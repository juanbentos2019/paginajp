import { useEffect, useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore, sections } from '../stores/useAppStore'
import { planetPositions } from '../components/canvas/NavShapes'

interface ShipState {
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3
}

interface KeyState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  rollLeft: boolean   // Q - roll izquierda
  rollRight: boolean  // E - roll derecha
  boost: boolean
}

// Configuración de la física - velocidad aumentada para explorar
const SHIP_CONFIG = {
  acceleration: 25,
  maxSpeed: 80,
  rotationSpeed: 1.2,
  damping: 0.96,        // Menos fricción = más velocidad sostenida
  angularDamping: 0.90, // Fricción angular
  boostMultiplier: 2.5, // Con boost: 200
  planetWarningRadius: 35,    // Radio para mostrar warning
  planetAttractionRadius: 18, // Radio para entrar al planeta (más grande para no traspasar)
  planetAttractionForce: 2,
}

// Configuración de cámara en tercera persona
const THIRD_PERSON_CONFIG = {
  distance: 8,      // Distancia detrás de la nave
  height: 3,        // Altura sobre la nave
  smoothing: 0.1,   // Suavizado del movimiento de cámara
}

export function useShipControls(shipRef: React.RefObject<THREE.Group>) {
  const { camera } = useThree()
  const { currentSection, isWarping, respawnPosition, isPlayingArcade } = useAppStore()
  
  // Estado de la nave
  const shipState = useRef<ShipState>({
    position: new THREE.Vector3(0, 0, 12),
    rotation: new THREE.Euler(0, 0, 0),
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
  })
  
  // Track de sección previa para detectar cambios
  const prevSection = useRef<string | null>(null)
  
  // Reposicionar nave cuando entramos/salimos de una sección
  useEffect(() => {
    if (currentSection && !prevSection.current) {
      // Entrando a una sección: posicionar en el centro del ambiente
      shipState.current.position.set(0, 0, 8)
      shipState.current.rotation.set(0, 0, 0)
      shipState.current.velocity.set(0, 0, 0)
      shipState.current.angularVelocity.set(0, 0, 0)
    } else if (!currentSection && prevSection.current) {
      // Saliendo de una sección: volver al espacio cerca del centro
      shipState.current.position.set(0, 2, 15)
      shipState.current.rotation.set(0, 0, 0)
      shipState.current.velocity.set(0, 0, 0)
      shipState.current.angularVelocity.set(0, 0, 0)
    }
    prevSection.current = currentSection
  }, [currentSection])
  
  // Reposicionar nave al respawnear
  useEffect(() => {
    if (respawnPosition) {
      console.log('[ShipControls] Moviendo nave a posición de respawn:', respawnPosition)
      shipState.current.position.set(respawnPosition.x, respawnPosition.y, respawnPosition.z)
      shipState.current.rotation.set(0, 0, 0)
      shipState.current.velocity.set(0, 0, 0)
      shipState.current.angularVelocity.set(0, 0, 0)
      
      // Actualizar cámara inmediatamente
      camera.position.set(respawnPosition.x, respawnPosition.y, respawnPosition.z)
      camera.rotation.set(0, 0, 0)
    }
  }, [respawnPosition, camera])
  
  // Estado de las teclas
  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    rollLeft: false,
    rollRight: false,
    boost: false,
  })
  
  // Delta del mouse para rotación directa (estilo FPS)
  const mouseDelta = useRef({ x: 0, y: 0 })
  const isPointerLocked = useRef(false)
  
  // Para móvil mantenemos el sistema anterior
  const mouseTarget = useRef({ x: 0, y: 0 })
  
  
  // Handlers de teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Desactivar controles durante warp o sección abierta
    if (isWarping || currentSection) return
    
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.current.forward = true
        break
      case 'KeyS':
      case 'ArrowDown':
        keys.current.backward = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        keys.current.left = true
        break
      case 'KeyD':
      case 'ArrowRight':
        keys.current.right = true
        break
      case 'KeyQ':
        keys.current.rollLeft = true
        break
      case 'KeyE':
        keys.current.rollRight = true
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.current.boost = true
        break
      case 'KeyV':
        // Toggle vista primera/tercera persona
        if (isPointerLocked.current) {
          useAppStore.getState().toggleCameraView()
        }
        break
    }
  }, [isWarping, currentSection])
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.current.forward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        keys.current.backward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        keys.current.left = false
        break
      case 'KeyD':
      case 'ArrowRight':
        keys.current.right = false
        break
      case 'KeyQ':
        keys.current.rollLeft = false
        break
      case 'KeyE':
        keys.current.rollRight = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.current.boost = false
        break
    }
  }, [])
  
  // Handler de mouse para rotación directa (Pointer Lock)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isWarping || currentSection || isPlayingArcade) return
    
    // Si el pointer está bloqueado, usar movementX/Y para rotación directa
    if (document.pointerLockElement) {
      const sensitivity = 0.002
      mouseDelta.current.x = e.movementX * sensitivity
      mouseDelta.current.y = e.movementY * sensitivity
    }
  }, [isWarping, currentSection, isPlayingArcade])
  
  // Click para activar Pointer Lock
  const handleClick = useCallback(() => {
    if (currentSection || isWarping || isPlayingArcade) return
    
    const canvas = document.querySelector('canvas')
    if (canvas && !document.pointerLockElement) {
      canvas.requestPointerLock()
    }
  }, [currentSection, isWarping, isPlayingArcade])
  
  // Listener para cambios en Pointer Lock
  const handlePointerLockChange = useCallback(() => {
    isPointerLocked.current = !!document.pointerLockElement
  }, [])
  
  // Registrar eventos
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      
      // Salir de pointer lock al desmontar
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
    }
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleClick, handlePointerLockChange])
  
  // Loop de física
  useFrame((_, delta) => {
    if (!shipRef.current) return
    
    // No procesar controles durante el minijuego arcade
    if (isPlayingArcade) return
    
    const state = shipState.current
    const k = keys.current
    
    // Leer input móvil del store
    const { mobileInput } = useAppStore.getState()
    const hasMobileInput = mobileInput.lookX !== 0 || mobileInput.lookY !== 0 || mobileInput.moveY !== 0
    
    // Joystick izquierdo: dirección/rotación de cámara (SOLO dirección, no movimiento)
    // Multiplicador 1.5x para móvil (50% más rápido)
    const mobileRotationMultiplier = 1.5
    if (mobileInput.lookX !== 0 || mobileInput.lookY !== 0) {
      mouseTarget.current.x = mobileInput.lookX * mobileRotationMultiplier
      mouseTarget.current.y = mobileInput.lookY * mobileRotationMultiplier
    } else if (hasMobileInput) {
      // Si hay input móvil pero no del joystick izquierdo, resetear dirección
      mouseTarget.current.x = 0
      mouseTarget.current.y = 0
    }
    
    // Joystick derecho: movimiento adelante/atrás
    // Usamos variables locales para móvil para no interferir con teclado
    let mobileForward = false
    let mobileBackward = false
    
    if (mobileInput.moveY > 0.1) {
      mobileForward = true
    } else if (mobileInput.moveY < -0.1) {
      mobileBackward = true
    }
    
    // Combinar input de teclado y móvil
    const effectiveForward = k.forward || mobileForward
    const effectiveBackward = k.backward || mobileBackward
    
    // Si está en warp, solo actualizar posición
    if (isWarping) {
      shipRef.current.position.copy(state.position)
      shipRef.current.rotation.copy(state.rotation)
      camera.position.copy(state.position)
      camera.rotation.copy(state.rotation)
      return
    }
    
    // Si hay sección abierta, permitir movimiento limitado dentro del ambiente
    if (currentSection) {
      // Movimiento más lento y restringido dentro del planeta
      const insideSpeed = 0.5
      
      if (effectiveForward) state.velocity.z -= insideSpeed * delta
      if (effectiveBackward) state.velocity.z += insideSpeed * delta
      if (k.left) state.velocity.x -= insideSpeed * delta
      if (k.right) state.velocity.x += insideSpeed * delta
      
      // Limitar posición dentro del ambiente
      state.velocity.multiplyScalar(0.95)
      state.position.add(state.velocity)
      state.position.x = THREE.MathUtils.clamp(state.position.x, -5, 5)
      state.position.z = THREE.MathUtils.clamp(state.position.z, 2, 12)
      state.position.y = THREE.MathUtils.clamp(state.position.y, -1, 3)
      
      shipRef.current.position.copy(state.position)
      shipRef.current.rotation.copy(state.rotation)
      camera.position.copy(state.position)
      camera.rotation.copy(state.rotation)
      return
    }
    
    // Multiplicador de velocidad
    const speedMult = k.boost ? SHIP_CONFIG.boostMultiplier : 1
    
    // --- Rotación basada en mouse (Pointer Lock) o joystick móvil ---
    if (isPointerLocked.current) {
      // PC: Rotación directa con el delta del mouse
      // Mouse derecha = girar derecha, Mouse arriba = mirar arriba
      const mouseSensitivity = 1.4  // Reducido 30% (era 2)
      state.rotation.y -= mouseDelta.current.x * mouseSensitivity
      state.rotation.x -= mouseDelta.current.y * mouseSensitivity
      
      // Resetear delta después de aplicar
      mouseDelta.current.x = 0
      mouseDelta.current.y = 0
    } else if (hasMobileInput) {
      // Móvil: Sistema anterior con joystick
      state.angularVelocity.y += -mouseTarget.current.x * SHIP_CONFIG.rotationSpeed * delta * 0.8
      const targetPitch = mouseTarget.current.y * 0.15
      state.angularVelocity.x += (targetPitch - state.rotation.x * 0.2) * SHIP_CONFIG.rotationSpeed * delta
    }
    
    // --- Roll con teclado Q/E (solo cuando pointer está bloqueado) ---
    if (isPointerLocked.current) {
      if (k.rollLeft) {
        state.rotation.z += SHIP_CONFIG.rotationSpeed * delta * 1.5  // Roll izquierda
      }
      if (k.rollRight) {
        state.rotation.z -= SHIP_CONFIG.rotationSpeed * delta * 1.5  // Roll derecha
      }
    }
    
    // --- Rotación con teclado A/D (solo sin pointer lock - móvil/fallback) ---
    if (!isPointerLocked.current) {
      if (k.left) {
        state.angularVelocity.z += SHIP_CONFIG.rotationSpeed * delta * 0.3
        state.angularVelocity.y += SHIP_CONFIG.rotationSpeed * delta * 0.5
      }
      if (k.right) {
        state.angularVelocity.z -= SHIP_CONFIG.rotationSpeed * delta * 0.3
        state.angularVelocity.y -= SHIP_CONFIG.rotationSpeed * delta * 0.5
      }
    }
    
    // --- Movimiento ---
    // Vector de dirección forward de la nave
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyEuler(state.rotation)
    
    const right = new THREE.Vector3(1, 0, 0)
    right.applyEuler(state.rotation)
    
    const up = new THREE.Vector3(0, 1, 0)
    up.applyEuler(state.rotation)
    
    // Acelerar según input (teclado o móvil)
    if (effectiveForward) {
      state.velocity.addScaledVector(forward, SHIP_CONFIG.acceleration * speedMult * delta)
    }
    if (effectiveBackward) {
      state.velocity.addScaledVector(forward, -SHIP_CONFIG.acceleration * speedMult * delta * 0.5)
    }
    
    // Limitar velocidad máxima
    const maxSpeed = SHIP_CONFIG.maxSpeed * speedMult
    if (state.velocity.length() > maxSpeed) {
      state.velocity.normalize().multiplyScalar(maxSpeed)
    }
    
    // Aplicar damping (fricción espacial)
    state.velocity.multiplyScalar(SHIP_CONFIG.damping)
    state.angularVelocity.multiplyScalar(SHIP_CONFIG.angularDamping)
    
    // Aplicar velocidades
    state.position.add(state.velocity.clone().multiplyScalar(delta))
    state.rotation.x += state.angularVelocity.x * delta
    state.rotation.y += state.angularVelocity.y * delta
    state.rotation.z += state.angularVelocity.z * delta
    
    // Sin límite de pitch - movimiento vertical libre
    // state.rotation.x = THREE.MathUtils.clamp(state.rotation.x, -Math.PI / 4, Math.PI / 4)
    
    // El roll se mantiene donde el usuario lo deja (sin reset automático)
    
    // --- DETECCIÓN DE PROXIMIDAD A PLANETAS ---
    const { navigateTo, setNearbyPlanet } = useAppStore.getState()
    let nearestPlanet: string | null = null
    let nearestDistance = Infinity
    
    for (const [planetId, planetPos] of Object.entries(planetPositions)) {
      const distance = state.position.distanceTo(planetPos)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestPlanet = planetId
      }
    }
    
    // Actualizar estado de proximidad
    if (nearestPlanet && nearestDistance < SHIP_CONFIG.planetWarningRadius) {
      const section = sections.find(s => s.id === nearestPlanet)
      if (section) {
        setNearbyPlanet({
          id: nearestPlanet,
          name: section.name,
          color: section.color,
          distance: nearestDistance
        })
      }
      
      // Si estamos muy cerca, entrar al planeta
      if (nearestDistance < SHIP_CONFIG.planetAttractionRadius) {
        setNearbyPlanet(null)
        navigateTo(nearestPlanet)
      }
    } else {
      setNearbyPlanet(null)
    }
    
    // Actualizar posición y rotación del grupo
    shipRef.current.position.copy(state.position)
    shipRef.current.rotation.copy(state.rotation)
    
    // Sincronizar cámara con la nave
    const { isThirdPerson: thirdPerson } = useAppStore.getState()
    
    if (thirdPerson) {
      // Tercera persona: cámara detrás y arriba de la nave
      const behindOffset = new THREE.Vector3(0, THIRD_PERSON_CONFIG.height, THIRD_PERSON_CONFIG.distance)
      behindOffset.applyEuler(state.rotation)
      
      const targetCamPos = state.position.clone().add(behindOffset)
      
      // Suavizar movimiento de cámara
      camera.position.lerp(targetCamPos, THIRD_PERSON_CONFIG.smoothing)
      
      // La cámara mira hacia la nave
      camera.lookAt(state.position)
    } else {
      // Primera persona: cámara en la nave
      camera.position.copy(state.position)
      camera.rotation.copy(state.rotation)
    }
    
    // Actualizar datos de navegación en el store
    const { updateShipData } = useAppStore.getState()
    updateShipData(
      { x: state.position.x, y: state.position.y, z: state.position.z },
      state.velocity.length()
    )
  })
  
  // Función para teletransportar la nave (usado por auto-pilot)
  const teleportTo = useCallback((position: THREE.Vector3, lookAt?: THREE.Vector3) => {
    shipState.current.position.copy(position)
    shipState.current.velocity.set(0, 0, 0)
    
    if (lookAt) {
      const direction = lookAt.clone().sub(position).normalize()
      shipState.current.rotation.y = Math.atan2(-direction.x, -direction.z)
      shipState.current.rotation.x = Math.asin(direction.y)
    }
  }, [])
  
  // Obtener estado actual
  const getState = useCallback(() => ({
    position: shipState.current.position.clone(),
    rotation: shipState.current.rotation.clone(),
    velocity: shipState.current.velocity.clone(),
    speed: shipState.current.velocity.length(),
  }), [])
  
  // Funciones para controles externos (joystick móvil)
  const setMobileInput = useCallback((direction: { x: number; y: number }) => {
    mouseTarget.current.x = direction.x
    mouseTarget.current.y = direction.y
    // Si hay input, activar movimiento
    keys.current.forward = Math.abs(direction.x) > 0.1 || Math.abs(direction.y) > 0.1
  }, [])
  
  const setBoost = useCallback((active: boolean) => {
    keys.current.boost = active
  }, [])
  
  // Exponer estado de boost globalmente para la estela
  useFrame(() => {
    // @ts-ignore
    window.__shipBoost = keys.current.boost
  })
  
  return {
    teleportTo,
    getState,
    shipState: shipState.current,
    setMobileInput,
    setBoost,
  }
}
