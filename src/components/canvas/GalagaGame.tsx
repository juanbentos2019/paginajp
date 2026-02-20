import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../stores/useAppStore'

// ============ CONFIGURACIÓN DEL JUEGO ============
const GAME_CONFIG = {
  // Área de juego
  width: 20,
  height: 30,
  
  // Jugador
  playerSpeed: 25,
  playerY: -12,
  playerSize: 1,
  
  // Disparos del jugador
  bulletSpeed: 40,
  bulletCooldown: 150, // ms
  
  // Enemigos
  enemyBaseSpeed: 3,
  enemySpacing: 2.5,
  enemyRows: 3,
  enemyCols: 6,
  enemyMoveInterval: 1000, // ms para moverse lateralmente
  enemyDropDistance: 1,
  
  // Disparos enemigos - mucho más bajo
  enemyShootChance: 0.001,
  enemyBulletSpeed: 10,
}

// ============ TIPOS ============
interface Bullet {
  id: string
  x: number
  y: number
  isEnemy: boolean
}

interface Enemy {
  id: string
  x: number
  y: number
  type: 'basic' | 'fast' | 'tank'
  health: number
  points: number
}

// ============ COMPONENTE PRINCIPAL ============
export default function GalagaGame() {
  const { isPlayingArcade, addArcadeScore, arcadeLoseLife, arcadeNextWave, arcadeGameOver } = useAppStore()
  
  // Estado local del juego
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'gameover'>('loading')
  const playerX = useRef(0)
  const bullets = useRef<Bullet[]>([])
  const enemies = useRef<Enemy[]>([])
  const enemyDirection = useRef(1)
  const lastEnemyMove = useRef(0)
  const lastShot = useRef(0)
  const keysPressed = useRef<Set<string>>(new Set())
  const gameStartTime = useRef(0)
  
  // Estado para forzar re-renders visuales
  const [, setRenderTick] = useState(0)
  
  const { camera } = useThree()
  
  // Estrellas de fondo (memorizadas para que no cambien)
  const stars = useMemo(() => 
    Array.from({ length: 50 }).map(() => ({
      x: (Math.random() - 0.5) * GAME_CONFIG.width,
      y: (Math.random() - 0.5) * GAME_CONFIG.height,
      size: 0.05 + Math.random() * 0.05,
      opacity: 0.3 + Math.random() * 0.4
    })), [])
  
  // ============ INICIALIZAR OLEADA ============
  const spawnWave = useCallback((wave: number) => {
    const newEnemies: Enemy[] = []
    const cols = Math.min(GAME_CONFIG.enemyCols + Math.floor(wave / 2), 8)
    const rows = Math.min(GAME_CONFIG.enemyRows + Math.floor(wave / 3), 5)
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col - cols / 2 + 0.5) * GAME_CONFIG.enemySpacing
        const y = 8 - row * GAME_CONFIG.enemySpacing
        
        let type: 'basic' | 'fast' | 'tank' = 'basic'
        let health = 1
        let points = 100
        
        if (wave >= 2 && row === 0) {
          type = 'fast'
          points = 150
        }
        if (wave >= 3 && row === 0 && col === Math.floor(cols / 2)) {
          type = 'tank'
          health = 3
          points = 300
        }
        
        newEnemies.push({ id: `enemy-${wave}-${row}-${col}`, x, y, type, health, points })
      }
    }
    
    enemies.current = newEnemies
    enemyDirection.current = 1
    console.log(`[Arcade] Spawned ${newEnemies.length} enemies for wave ${wave}`)
  }, [])
  
  // ============ INICIALIZAR JUEGO ============
  useEffect(() => {
    if (!isPlayingArcade) {
      setGameState('loading')
      enemies.current = []
      bullets.current = []
      return
    }
    
    console.log('[Arcade] Initializing game...')
    
    // Configurar cámara para vista 2D
    const cam = camera as THREE.PerspectiveCamera
    cam.position.set(0, 0, 30)
    cam.lookAt(0, 0, 0)
    cam.updateProjectionMatrix()
    
    // Liberar pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    
    // Inicializar estado del juego
    playerX.current = 0
    bullets.current = []
    enemies.current = []
    lastEnemyMove.current = Date.now()
    lastShot.current = 0
    gameStartTime.current = Date.now()
    
    // Spawneamos enemigos directamente
    const newEnemies: Enemy[] = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        newEnemies.push({
          id: `enemy-1-${row}-${col}`,
          x: (col - 2.5) * 2.5,
          y: 8 - row * 2.5,
          type: 'basic',
          health: 1,
          points: 100
        })
      }
    }
    enemies.current = newEnemies
    console.log('[Arcade] Spawned', newEnemies.length, 'enemies')
    
    // Iniciar juego después de un breve delay
    const startTimeout = setTimeout(() => {
      console.log('[Arcade] Game playing!')
      setGameState('playing')
    }, 300)
    
    // Listeners de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code)
      if (e.code === 'Escape') {
        useAppStore.getState().exitArcade()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      clearTimeout(startTimeout)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayingArcade])
  
  // ============ LOOP PRINCIPAL DEL JUEGO ============
  useFrame((_, delta) => {
    if (!isPlayingArcade || arcadeGameOver || gameState !== 'playing') return
    
    // Invulnerabilidad los primeros 2 segundos
    const timeSinceStart = Date.now() - gameStartTime.current
    const isInvulnerable = timeSinceStart < 2000
    
    const time = Date.now() // Usar Date.now() en lugar de clock
    const keys = keysPressed.current
    
    // --- Movimiento del jugador ---
    if (keys.has('ArrowLeft') || keys.has('KeyA')) {
      playerX.current -= GAME_CONFIG.playerSpeed * delta
    }
    if (keys.has('ArrowRight') || keys.has('KeyD')) {
      playerX.current += GAME_CONFIG.playerSpeed * delta
    }
    
    // Limitar a área de juego
    playerX.current = THREE.MathUtils.clamp(
      playerX.current, 
      -GAME_CONFIG.width / 2 + 1, 
      GAME_CONFIG.width / 2 - 1
    )
    
    // --- Disparo del jugador ---
    if (keys.has('Space') && time - lastShot.current > GAME_CONFIG.bulletCooldown) {
      bullets.current.push({
        id: `bullet-${Date.now()}`,
        x: playerX.current,
        y: GAME_CONFIG.playerY + 1,
        isEnemy: false
      })
      lastShot.current = time
    }
    
    // --- Mover balas ---
    bullets.current = bullets.current.filter(bullet => {
      if (bullet.isEnemy) {
        bullet.y -= GAME_CONFIG.enemyBulletSpeed * delta
        return bullet.y > -GAME_CONFIG.height / 2
      } else {
        bullet.y += GAME_CONFIG.bulletSpeed * delta
        return bullet.y < GAME_CONFIG.height / 2
      }
    })
    
    // --- Mover enemigos ---
    if (time - lastEnemyMove.current > GAME_CONFIG.enemyMoveInterval) {
      lastEnemyMove.current = time
      
      // Verificar si algún enemigo toca el borde
      let hitEdge = false
      enemies.current.forEach(enemy => {
        const nextX = enemy.x + enemyDirection.current * 1.5
        if (Math.abs(nextX) > GAME_CONFIG.width / 2 - 1) {
          hitEdge = true
        }
      })
      
      if (hitEdge) {
        // Bajar y cambiar dirección
        enemyDirection.current *= -1
        enemies.current.forEach(enemy => {
          enemy.y -= GAME_CONFIG.enemyDropDistance
        })
      } else {
        // Mover horizontalmente
        enemies.current.forEach(enemy => {
          enemy.x += enemyDirection.current * 1.5
        })
      }
    }
    
    // --- Disparos enemigos ---
    enemies.current.forEach(enemy => {
      if (Math.random() < GAME_CONFIG.enemyShootChance) {
        bullets.current.push({
          id: `ebullet-${Date.now()}-${Math.random()}`,
          x: enemy.x,
          y: enemy.y - 0.5,
          isEnemy: true
        })
      }
    })
    
    // --- Colisiones: balas jugador vs enemigos ---
    const playerBullets = bullets.current.filter(b => !b.isEnemy)
    playerBullets.forEach(bullet => {
      enemies.current.forEach(enemy => {
        const dist = Math.sqrt(
          (bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2
        )
        
        if (dist < 1.2) {
          // Hit!
          enemy.health--
          bullet.y = 999 // Marcar para eliminar
          
          if (enemy.health <= 0) {
            addArcadeScore(enemy.points)
            enemy.y = 999 // Marcar para eliminar
          }
        }
      })
    })
    
    // Limpiar enemigos y balas eliminados
    enemies.current = enemies.current.filter(e => e.y < 900)
    bullets.current = bullets.current.filter(b => b.y < 900)
    
    // --- Colisiones: balas enemigo vs jugador (solo si no es invulnerable) ---
    if (!isInvulnerable) {
      const enemyBullets = bullets.current.filter(b => b.isEnemy)
      enemyBullets.forEach(bullet => {
        const dist = Math.sqrt(
          (bullet.x - playerX.current) ** 2 + 
          (bullet.y - GAME_CONFIG.playerY) ** 2
        )
        
        if (dist < 1.5) {
          // Jugador golpeado!
          arcadeLoseLife()
          bullet.y = -999
          // Reset posición
          playerX.current = 0
          bullets.current = bullets.current.filter(b => !b.isEnemy)
          // Dar un poco de invulnerabilidad temporal
          gameStartTime.current = Date.now()
        }
      })
      
      // --- Colisiones: enemigos tocan al jugador ---
      enemies.current.forEach(enemy => {
        if (enemy.y < GAME_CONFIG.playerY + 2) {
          arcadeLoseLife()
          enemy.y = 999
          gameStartTime.current = Date.now()
        }
      })
    }
    
    // --- Verificar fin de oleada ---
    if (enemies.current.length === 0 && !arcadeGameOver) {
      arcadeNextWave()
      gameStartTime.current = Date.now() // Reset invulnerabilidad
      setTimeout(() => {
        spawnWave(useAppStore.getState().arcadeWave)
      }, 1000)
    }
    
    // Forzar re-render
    setRenderTick(n => n + 1)
  })
  
  if (!isPlayingArcade) return null
  
  return (
    <group>
      {/* Fondo oscuro */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[GAME_CONFIG.width + 4, GAME_CONFIG.height + 4]} />
        <meshBasicMaterial color="#050510" />
      </mesh>
      
      {/* Bordes */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(GAME_CONFIG.width, GAME_CONFIG.height, 0.1)]} />
        <lineBasicMaterial color="#ff00ff" transparent opacity={0.5} />
      </lineSegments>
      
      {/* Nave del jugador */}
      <group position={[playerX.current, GAME_CONFIG.playerY, 0]}>
        <mesh>
          <coneGeometry args={[0.8, 2, 3]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh position={[-0.6, -0.5, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.8, 0.3, 0.1]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh position={[0.6, -0.5, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.8, 0.3, 0.1]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh position={[0, -1.2, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      </group>
      
      {/* Balas del jugador */}
      {bullets.current.filter(b => !b.isEnemy).map(bullet => (
        <mesh key={bullet.id} position={[bullet.x, bullet.y, 0]}>
          <boxGeometry args={[0.15, 0.6, 0.1]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      ))}
      
      {/* Balas enemigas */}
      {bullets.current.filter(b => b.isEnemy).map(bullet => (
        <mesh key={bullet.id} position={[bullet.x, bullet.y, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      ))}
      
      {/* Enemigos */}
      {enemies.current.map(enemy => (
        <group key={enemy.id} position={[enemy.x, enemy.y, 0]}>
          {enemy.type === 'basic' && (
            <mesh>
              <boxGeometry args={[1, 1, 0.3]} />
              <meshBasicMaterial color="#ff00ff" />
            </mesh>
          )}
          {enemy.type === 'fast' && (
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.8, 0.8, 0.3]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          )}
          {enemy.type === 'tank' && (
            <>
              <mesh>
                <boxGeometry args={[1.5, 1.5, 0.5]} />
                <meshBasicMaterial color="#ff3300" />
              </mesh>
              <mesh position={[0, 1, 0]}>
                <boxGeometry args={[enemy.health * 0.4, 0.15, 0.1]} />
                <meshBasicMaterial color="#00ff00" />
              </mesh>
            </>
          )}
        </group>
      ))}
      
      {/* Estrellas de fondo */}
      {stars.map((star, i) => (
        <mesh key={i} position={[star.x, star.y, -4]}>
          <circleGeometry args={[star.size, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={star.opacity} />
        </mesh>
      ))}
      
      {/* Luz */}
      <ambientLight intensity={1} />
    </group>
  )
}
