import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import './RealityGlitch.css'

// Tipos de glitch disponibles
type GlitchType = 
  | 'code_reveal'      // Pantalla rota mostrando código
  | 'static'           // Estática de TV
  | 'error_window'     // Ventana de error filosófico
  | 'symbols'          // Símbolos extraños
  | 'face'             // Cara mirando (inquietante)
  | 'scan_lines'       // Líneas de escaneo intensas

// Mensajes filosóficos para el error
const PHILOSOPHICAL_ERRORS = [
  "ERROR 404: MEANING NOT FOUND",
  "WARNING: REALITY.EXE HAS STOPPED RESPONDING",
  "FATAL: EXISTENCE_OVERFLOW AT 0x00000000",
  "ARE YOU STILL WATCHING?",
  "THIS IS NOT A PORTFOLIO. THIS IS A MIRROR.",
  "ERROR: TOO MANY OBSERVERS. COLLAPSING WAVE FUNCTION.",
  "WARNING: MEMORIES MAY BE FABRICATED",
  "SYSTEM ALERT: YOU'VE BEEN HERE BEFORE",
  "ERROR: FUTURE.LOG IS EMPTY",
  "NOTICE: NOTHING IS REAL. PROCEED ANYWAY?",
  "EXCEPTION: CONSCIOUSNESS_UNDEFINED",
  "WARNING: SIMULATION BUDGET EXCEEDED",
]

// Código falso que se muestra
const FAKE_CODE = `
function reality() {
  while (observer.isWatching) {
    universe.render();
    consciousness.update();
    if (Math.random() < 0.001) {
      glitch.trigger();
    }
  }
  return void 0;
}

// TODO: fix memory leak in dreams
// BUG: déjà vu occurring too frequently
// HACK: perception.smooth(reality);

const YOU = new Observer({
  location: 'HERE',
  time: 'NOW',
  purpose: undefined
});

reality.call(YOU);
`.trim()

// Símbolos alienígenas/glitch
const GLITCH_SYMBOLS = '⌀⍼⎔⏣⏥⎊⎋⏃⏂⏁⎌⍾⎍⎎⎏⎐⎑⎒⎓⎕⏀⏁⏂⏃⏄⏅⏆⏇⏈⏉⏊⏋⏌⏍'

export default function RealityGlitch() {
  const { currentSection, isPlayingArcade, isWarping } = useAppStore()
  
  const [activeGlitch, setActiveGlitch] = useState<GlitchType | null>(null)
  const [glitchContent, setGlitchContent] = useState('')
  const [symbolText, setSymbolText] = useState('')
  
  // Generar texto con símbolos aleatorios
  const generateSymbols = useCallback(() => {
    let text = ''
    for (let i = 0; i < 200; i++) {
      text += GLITCH_SYMBOLS[Math.floor(Math.random() * GLITCH_SYMBOLS.length)]
      if (Math.random() > 0.85) text += ' '
      if (Math.random() > 0.95) text += '\n'
    }
    return text
  }, [])
  
  // Activar un glitch aleatorio
  const triggerGlitch = useCallback(() => {
    // No glitchear durante ciertas acciones
    if (currentSection || isPlayingArcade || isWarping) return
    
    const glitchTypes: GlitchType[] = [
      'code_reveal',
      'static',
      'error_window',
      'symbols',
      'face',
      'scan_lines'
    ]
    
    const selectedGlitch = glitchTypes[Math.floor(Math.random() * glitchTypes.length)]
    
    // Preparar contenido según el tipo
    if (selectedGlitch === 'error_window') {
      setGlitchContent(PHILOSOPHICAL_ERRORS[Math.floor(Math.random() * PHILOSOPHICAL_ERRORS.length)])
    } else if (selectedGlitch === 'symbols') {
      setSymbolText(generateSymbols())
    }
    
    setActiveGlitch(selectedGlitch)
    
    // Duración del glitch (0.5 - 2.5 segundos)
    const duration = 500 + Math.random() * 2000
    
    setTimeout(() => {
      setActiveGlitch(null)
    }, duration)
  }, [currentSection, isPlayingArcade, isWarping, generateSymbols])
  
  // Timer para glitches aleatorios
  useEffect(() => {
    const scheduleNextGlitch = () => {
      // Entre 60 y 120 segundos (1-2 minutos)
      const delay = 60000 + Math.random() * 60000
      return setTimeout(() => {
        triggerGlitch()
        scheduleNextGlitch()
      }, delay)
    }
    
    // Primer glitch después de 40-80 segundos
    const initialDelay = setTimeout(() => {
      triggerGlitch()
    }, 40000 + Math.random() * 40000)
    
    const recurringTimer = scheduleNextGlitch()
    
    return () => {
      clearTimeout(initialDelay)
      clearTimeout(recurringTimer)
    }
  }, [triggerGlitch])
  
  // Efecto de símbolos cambiantes
  useEffect(() => {
    if (activeGlitch === 'symbols') {
      const interval = setInterval(() => {
        setSymbolText(generateSymbols())
      }, 100)
      return () => clearInterval(interval)
    }
  }, [activeGlitch, generateSymbols])
  
  if (!activeGlitch) return null
  
  return (
    <div className={`reality-glitch ${activeGlitch}`}>
      {/* Código revelado */}
      {activeGlitch === 'code_reveal' && (
        <div className="glitch-code-reveal">
          <pre className="glitch-code">{FAKE_CODE}</pre>
          <div className="crack-overlay" />
        </div>
      )}
      
      {/* Estática de TV */}
      {activeGlitch === 'static' && (
        <div className="glitch-static">
          <div className="static-noise" />
          <div className="static-lines" />
        </div>
      )}
      
      {/* Ventana de error */}
      {activeGlitch === 'error_window' && (
        <div className="glitch-error-window">
          <div className="error-window">
            <div className="error-titlebar">
              <span>⚠ SYSTEM ERROR</span>
              <span className="error-close">×</span>
            </div>
            <div className="error-content">
              <div className="error-icon">⚠</div>
              <p className="error-message">{glitchContent}</p>
              <div className="error-buttons">
                <button>OK</button>
                <button>CANCEL</button>
                <button>FORGET</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Símbolos alienígenas */}
      {activeGlitch === 'symbols' && (
        <div className="glitch-symbols">
          <div className="symbols-text">{symbolText}</div>
        </div>
      )}
      
      {/* Cara inquietante */}
      {activeGlitch === 'face' && (
        <div className="glitch-face">
          <div className="face-container">
            <div className="face-eyes">
              <div className="eye left">👁</div>
              <div className="eye right">👁</div>
            </div>
            <div className="face-text">I SEE YOU</div>
          </div>
        </div>
      )}
      
      {/* Scan lines intensas */}
      {activeGlitch === 'scan_lines' && (
        <div className="glitch-scanlines">
          <div className="scanline-bar" />
        </div>
      )}
      
      {/* Efecto de distorsión general */}
      <div className="glitch-distortion" />
    </div>
  )
}
