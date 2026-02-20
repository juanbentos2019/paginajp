import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import './NeverPlanetVictory.css'

// Generar partículas de confeti
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    color: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#a855f7'][
      Math.floor(Math.random() * 6)
    ],
    size: 5 + Math.random() * 10,
    rotation: Math.random() * 360,
  }))
}

export default function NeverPlanetVictory() {
  const { 
    neverPlanetCaught, 
    neverPlanetCatches, 
    neverPlanetStartTime,
    resetNeverPlanet 
  } = useAppStore()
  
  const [isVisible, setIsVisible] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  
  // Calcular tiempo gastado
  useEffect(() => {
    if (neverPlanetCaught && neverPlanetStartTime) {
      const elapsed = Math.floor((Date.now() - neverPlanetStartTime) / 1000 / 60)
      setTimeSpent(elapsed)
      setIsVisible(true)
    }
  }, [neverPlanetCaught, neverPlanetStartTime])
  
  // Generar confeti
  const confetti = useMemo(() => generateConfetti(50), [])
  
  const handleClose = () => {
    setIsVisible(false)
    // Resetear después de la animación
    setTimeout(() => {
      resetNeverPlanet()
    }, 500)
  }
  
  if (!neverPlanetCaught) return null
  
  return (
    <div className={`never-planet-victory ${isVisible ? 'visible' : ''}`}>
      {/* Confeti */}
      <div className="confetti-container">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="confetti"
            style={{
              left: `${particle.x}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              backgroundColor: particle.color,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: `rotate(${particle.rotation}deg)`,
            }}
          />
        ))}
      </div>
      
      {/* Modal */}
      <div className="victory-modal">
        <div className="victory-glitch-line" />
        
        <div className="victory-icon">🎉</div>
        
        <h1 className="victory-title">
          <span className="glitch-text" data-text="IMPOSIBLE">IMPOSIBLE</span>
        </h1>
        
        <p className="victory-subtitle">
          ...o eso pensábamos.
        </p>
        
        <div className="victory-message">
          <p>
            Felicidades. Has perdido <span className="highlight">{timeSpent || '∞'}</span> minutos de tu vida 
            persiguiendo algo que no querías que atraparas.
          </p>
          <p className="small">
            Esa misma perseverancia es la que yo pongo en cada proyecto.
          </p>
        </div>
        
        <div className="victory-cta">
          <span className="cta-text">No es por nada, pero soy bastante bueno.</span>
          <span className="cta-subtext">Solo digo... estoy disponible 😏</span>
        </div>
        
        <div className="victory-stats">
          <div className="stat">
            <span className="stat-value">{neverPlanetCatches}</span>
            <span className="stat-label">
              {neverPlanetCatches === 1 
                ? 'persona lo ha logrado' 
                : 'personas lo han logrado'}
            </span>
          </div>
          {neverPlanetCatches <= 10 && (
            <div className="stat-badge">
              🏆 Top 10 mundial
            </div>
          )}
        </div>
        
        <button className="victory-close" onClick={handleClose}>
          Cerrar y presumir después
        </button>
        
        <div className="victory-footer">
          <span className="footer-text">
            El planeta NUNCA volverá... hasta que recargues la página.
          </span>
        </div>
      </div>
    </div>
  )
}
