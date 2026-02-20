import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import './EarthCredits.css'

const CREDITS = [
  { role: 'UN VIAJE DE', name: '' },
  { role: '', name: '🚀 TÚ 🚀' },
  { role: '', name: '' },
  { role: '', name: '' },
  { role: 'Director', name: 'Tu Curiosidad' },
  { role: 'Productor Ejecutivo', name: 'Tu Paciencia' },
  { role: 'Guionista', name: 'La Soledad del Espacio' },
  { role: '', name: '' },
  { role: 'Diseño de Producción', name: 'El Vacío Infinito' },
  { role: 'Fotografía', name: 'Las Estrellas Distantes' },
  { role: '', name: '' },
  { role: 'ELENCO', name: '' },
  { role: 'El Explorador', name: 'TÚ' },
  { role: 'Planeta Misterioso', name: 'Tierra' },
  { role: 'Antagonista', name: 'La Gravedad' },
  { role: 'Cameo Especial', name: 'La Luna' },
  { role: '', name: '' },
  { role: 'Efectos Especiales', name: 'WebGL & Three.js' },
  { role: 'Música Original', name: 'El Silencio del Cosmos' },
  { role: '', name: '' },
  { role: 'AGRADECIMIENTOS ESPECIALES', name: '' },
  { role: '', name: 'A tu mouse por aguantar tanto scroll' },
  { role: '', name: 'Al café que te mantuvo despierto' },
  { role: '', name: 'A Stack Overflow, como siempre' },
  { role: '', name: 'A la persona que te dijo "sal más"' },
  { role: '', name: '(claramente no le hiciste caso)' },
  { role: '', name: '' },
  { role: '', name: '' },
  { role: 'Distancia recorrida:', name: '~6,000 unidades' },
  { role: 'Tiempo en el espacio:', name: 'Demasiado' },
  { role: 'Easter eggs encontrados:', name: '¿Todos?' },
  { role: '', name: '' },
  { role: '', name: '' },
  { role: '', name: '"Somewhere, something incredible' },
  { role: '', name: 'is waiting to be known."' },
  { role: '', name: '— Carl Sagan' },
  { role: '', name: '' },
  { role: '', name: '' },
  { role: '', name: '' },
  { role: 'FIN', name: '' },
  { role: '', name: '' },
  { role: '', name: '' },
  { role: '', name: '...¿o no?' },
]

export default function EarthCredits() {
  const { earthCreditsActive, earthCreditsPhase, setEarthCreditsPhase, endEarthCredits } = useAppStore()
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showRickroll, setShowRickroll] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rickrollAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // Música épica de fondo (usamos un audio royalty-free como placeholder)
  useEffect(() => {
    if (earthCreditsActive && earthCreditsPhase === 'credits') {
      // Scroll automático de créditos
      const scrollInterval = setInterval(() => {
        setScrollPosition(prev => {
          const newPos = prev + 1
          // Cuando terminen los créditos, mostrar rickroll
          if (newPos > CREDITS.length * 60 + 200) {
            clearInterval(scrollInterval)
            setTimeout(() => {
              setEarthCreditsPhase('rickroll')
              setShowRickroll(true)
            }, 1000)
          }
          return newPos
        })
      }, 50)
      
      return () => clearInterval(scrollInterval)
    }
  }, [earthCreditsActive, earthCreditsPhase])
  
  // Rickroll audio
  useEffect(() => {
    if (showRickroll && earthCreditsPhase === 'rickroll') {
      // Reproducir Never Gonna Give You Up
      if (rickrollAudioRef.current) {
        rickrollAudioRef.current.volume = 0.5
        rickrollAudioRef.current.play().catch(() => {})
      }
    }
    
    return () => {
      if (rickrollAudioRef.current) {
        rickrollAudioRef.current.pause()
        rickrollAudioRef.current.currentTime = 0
      }
    }
  }, [showRickroll, earthCreditsPhase])
  
  const handleClose = () => {
    if (rickrollAudioRef.current) {
      rickrollAudioRef.current.pause()
    }
    setScrollPosition(0)
    setShowRickroll(false)
    endEarthCredits()
  }
  
  const skipToRickroll = () => {
    setEarthCreditsPhase('rickroll')
    setShowRickroll(true)
  }
  
  if (!earthCreditsActive) return null
  
  return (
    <div className="earth-credits-overlay">
      {/* Audio para rickroll - usamos un URL de audio directo */}
      <audio 
        ref={rickrollAudioRef}
        src="https://www.myinstants.com/media/sounds/never-gonna-give-you-up-full-version-original.mp3"
        loop
      />
      
      {earthCreditsPhase === 'credits' && (
        <div className="credits-container">
          <div 
            className="credits-scroll"
            style={{ transform: `translateY(-${scrollPosition}px)` }}
          >
            <div className="credits-intro">
              <span className="intro-text">HAS ENCONTRADO</span>
              <span className="intro-earth">🌍 LA TIERRA 🌍</span>
              <span className="intro-subtitle">Tu hogar, a 6000 unidades de distancia</span>
            </div>
            
            {CREDITS.map((credit, index) => (
              <div key={index} className="credit-line">
                {credit.role && <span className="credit-role">{credit.role}</span>}
                {credit.name && <span className="credit-name">{credit.name}</span>}
              </div>
            ))}
          </div>
          
          <button className="skip-button" onClick={skipToRickroll}>
            SKIP ▸▸
          </button>
        </div>
      )}
      
      {earthCreditsPhase === 'rickroll' && showRickroll && (
        <div className="rickroll-container">
          <div className="rickroll-content">
            <div className="rickroll-surprise">🎉 SORPRESA 🎉</div>
            
            <div className="rickroll-gif">
              <img 
                src="https://media.giphy.com/media/Vuw9m5wXviFIQ/giphy.gif" 
                alt="Rick Astley"
              />
            </div>
            
            <div className="rickroll-text">
              <p className="rickroll-main">Never gonna give you up! 🎵</p>
              <p className="rickroll-sub">
                ¿En serio volaste 6,000 unidades para esto?
              </p>
              <p className="rickroll-respect">RESPECT. 🫡</p>
            </div>
            
            <div className="rickroll-stats">
              <p>🏆 LOGRO DESBLOQUEADO 🏆</p>
              <p className="achievement-name">"El Que Llegó Hasta El Final"</p>
              <p className="achievement-desc">Encontraste la Tierra y te rickrollearon en el espacio.</p>
            </div>
            
            <button className="close-button" onClick={handleClose}>
              OK, me lo merezco. Volver al espacio 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
