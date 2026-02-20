import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import './CockpitHUD.css'

// Comandos cortos para el terminal
const TERMINAL_COMMANDS = [
  'SYS OK',
  'NAV 98%',
  'PWR 100',
  'SCAN CLR',
  'THR ALN',
  'SHLD ON',
  'COM 147',
  'GYRO OK',
  'FUEL 87',
  'HULL 100',
  'RAD ACT',
  'LIFE OK',
  'T -270C',
  'GRAV ON',
  'WARP RD',
  'AUTO OF',
  'WEAP OK',
  'SENS ON',
  'CPU 12%',
  'MEM 4.7',
  'LAT 003',
  'X 127.4',
  'Y -34.2',
  'Z 892.1',
]

// Componente para una línea de terminal animada
function TerminalLine({ side, index }: { side: 'left' | 'right', index: number }) {
  const [text, setText] = useState('')
  const [opacity, setOpacity] = useState(0)
  
  useEffect(() => {
    // Delay inicial aleatorio
    const initialDelay = Math.random() * 8000 + index * 400
    
    const startCycle = () => {
      // Elegir comando aleatorio
      const cmd = TERMINAL_COMMANDS[Math.floor(Math.random() * TERMINAL_COMMANDS.length)]
      setText(cmd)
      setOpacity(0.15 + Math.random() * 0.25) // Opacidad sutil
      
      // Desvanecer después de un tiempo
      const fadeTimeout = setTimeout(() => {
        setOpacity(0)
      }, 2000 + Math.random() * 3000)
      
      // Siguiente ciclo
      const nextTimeout = setTimeout(startCycle, 4000 + Math.random() * 6000)
      
      return () => {
        clearTimeout(fadeTimeout)
        clearTimeout(nextTimeout)
      }
    }
    
    const initTimeout = setTimeout(startCycle, initialDelay)
    return () => clearTimeout(initTimeout)
  }, [index])
  
  return (
    <div 
      className={`terminal-line ${side}`}
      style={{ 
        opacity,
        top: `${10 + index * 8}%`,
      }}
    >
      <span className="terminal-prefix">&gt;</span>
      {text}
    </div>
  )
}

// Componente para datos numéricos que cambian
function DataStream({ side }: { side: 'left' | 'right' }) {
  const [values, setValues] = useState<string[]>([])
  
  useEffect(() => {
    const generateValues = () => {
      const newValues = Array.from({ length: 5 }, () => {
        const type = Math.random()
        if (type < 0.4) {
          // Hex corto
          return Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase()
        } else if (type < 0.7) {
          // Número corto
          return (Math.random() * 100).toFixed(1)
        } else {
          // Binario corto
          return Array.from({ length: 6 }, () => Math.round(Math.random())).join('')
        }
      })
      setValues(newValues)
    }
    
    generateValues()
    const interval = setInterval(generateValues, 200)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className={`data-stream ${side}`}>
      {values.map((val, i) => (
        <span key={i} className="data-value">{val}</span>
      ))}
    </div>
  )
}

export default function CockpitHUD() {
  const { currentSection, isWarping, nearbyPlanet, isThirdPerson, isPlayingArcade } = useAppStore()
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  
  // Escuchar cambios en pointer lock
  useEffect(() => {
    const handleChange = () => {
      setIsPointerLocked(!!document.pointerLockElement)
    }
    document.addEventListener('pointerlockchange', handleChange)
    return () => document.removeEventListener('pointerlockchange', handleChange)
  }, [])
  
  // No mostrar cuando estamos dentro de una sección o jugando arcade
  if (currentSection || isPlayingArcade) return null
  
  return (
    <div className={`cockpit-hud ${isWarping ? 'warping' : ''}`}>
      {/* Marco superior */}
      <div className="cockpit-frame-top">
        <div className="frame-corner left" />
        <div className="frame-line" />
        <div className="frame-corner right" />
      </div>
      
      {/* Marcos laterales */}
      <div className="cockpit-frame-left">
        <div className="side-panel">
          <div className="panel-line" />
          <div className="panel-line" />
          <div className="panel-line" />
        </div>
      </div>
      
      <div className="cockpit-frame-right">
        <div className="side-panel">
          <div className="panel-line" />
          <div className="panel-line" />
          <div className="panel-line" />
        </div>
        
        {/* Guía de controles */}
        <div className="controls-guide">
          <div className="guide-title">CONTROLS</div>
          <div className="control-item">
            <div className="key-group">
              <span className="key">W</span>
              <span className="key">A</span>
              <span className="key">S</span>
              <span className="key">D</span>
            </div>
            <span className="control-desc">Move</span>
          </div>
          <div className="control-item">
            <div className="key-group">
              <span className="key">Q</span>
              <span className="key">E</span>
            </div>
            <span className="control-desc">Barrel Roll</span>
          </div>
          <div className="control-item">
            <span className="key">SHIFT</span>
            <span className="control-desc">Boost</span>
          </div>
          <div className="control-item">
            <span className="key mouse">🖱️</span>
            <span className="control-desc">Look</span>
          </div>
          <div className="control-item">
            <span className="key">CLICK</span>
            <span className="control-desc">Select</span>
          </div>
          <div className="control-item">
            <span className="key">SPACE</span>
            <span className="control-desc">Fire</span>
          </div>
          <div className="control-item">
            <span className="key">V</span>
            <span className="control-desc">View</span>
          </div>
        </div>
      </div>
      
      {/* Consola inferior */}
      <div className="cockpit-console">
        <div className="console-left">
          <div className="gauge">
            <span className="gauge-label">SPD</span>
            <div className="gauge-bar">
              <div className="gauge-fill" />
            </div>
          </div>
        </div>
        
        <div className="console-center">
          <div className="targeting-reticle">
            <div className="reticle-ring" />
            <div className="reticle-cross horizontal" />
            <div className="reticle-cross vertical" />
          </div>
        </div>
        
        <div className="console-right">
          <div className="gauge">
            <span className="gauge-label">PWR</span>
            <div className="gauge-bar">
              <div className="gauge-fill power" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Botón de disparo para mobile */}
      <button 
        className="fire-button"
        onTouchStart={(e) => {
          e.preventDefault()
          // @ts-ignore
          window.shootLaser?.()
        }}
        onClick={() => {
          // @ts-ignore
          window.shootLaser?.()
        }}
      >
        <span className="fire-icon">⚡</span>
        <span className="fire-text">FIRE</span>
      </button>
      
      {/* Efecto de visor */}
      <div className="visor-overlay" />
      
      {/* Terminal de datos laterales */}
      <div className="terminal-container left">
        {Array.from({ length: 8 }).map((_, i) => (
          <TerminalLine key={`left-${i}`} side="left" index={i} />
        ))}
        <DataStream side="left" />
      </div>
      
      <div className="terminal-container right">
        {Array.from({ length: 8 }).map((_, i) => (
          <TerminalLine key={`right-${i}`} side="right" index={i} />
        ))}
        <DataStream side="right" />
      </div>
      
      {/* Aviso de Pointer Lock */}
      {!isPointerLocked && (
        <div className="pointer-lock-notice">
          <span className="notice-icon">🕹️</span>
          <span>Click para controlar la nave</span>
        </div>
      )}
      
      {isPointerLocked && (
        <div className="pointer-lock-active">
          <span className="key-hint">ESC</span>
          <span>para liberar cursor</span>
          <span className="view-mode">{isThirdPerson ? '3ª Persona' : '1ª Persona'}</span>
        </div>
      )}
      
      {/* Warning de proximidad a planeta */}
      {nearbyPlanet && (
        <div 
          className="planet-proximity-warning"
          style={{ '--planet-color': nearbyPlanet.color } as React.CSSProperties}
        >
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <span className="warning-title">PROXIMIDAD DETECTADA</span>
            <span className="planet-name" style={{ color: nearbyPlanet.color }}>
              {nearbyPlanet.name.toUpperCase()}
            </span>
            <span className="distance-text">
              {nearbyPlanet.distance.toFixed(1)}km
            </span>
          </div>
          <div className="warning-bar">
            <div 
              className="warning-bar-fill" 
              style={{ 
                width: `${Math.max(0, 100 - ((nearbyPlanet.distance - 18) / 17) * 100)}%`,
                backgroundColor: nearbyPlanet.color 
              }} 
            />
          </div>
        </div>
      )}
    </div>
  )
}
