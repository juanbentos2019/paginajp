import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import './DeathScreen.css'

const RESPAWN_DELAY = 1500 // 1.5 segundos

export default function DeathScreen() {
  const { isDead, killedBy, respawn } = useAppStore()
  const [showScreen, setShowScreen] = useState(false)
  
  useEffect(() => {
    if (!isDead) {
      setShowScreen(false)
      return
    }
    
    // Mostrar pantalla de muerte
    setShowScreen(true)
    
    // Respawn automático después de 1.5 segundos
    const timer = setTimeout(() => {
      console.log('[DeathScreen] Respawn automático')
      respawn()
      setShowScreen(false)
    }, RESPAWN_DELAY)
    
    return () => clearTimeout(timer)
  }, [isDead, respawn])
  
  if (!showScreen) return null
  
  return (
    <div className="death-screen">
      <div className="death-content">
        <div className="death-icon">💥</div>
        <h1 className="death-title">DESTROYED</h1>
        <p className="death-subtitle">Respawning...</p>
        
        {killedBy && (
          <p className="death-killer">
            by <span className="killer-name">{killedBy.substring(0, 15)}...</span>
          </p>
        )}
      </div>
      
      {/* Partículas de explosión */}
      <div className="explosion-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              '--delay': `${Math.random() * 0.5}s`,
              '--x': `${(Math.random() - 0.5) * 200}px`,
              '--y': `${(Math.random() - 0.5) * 200}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
