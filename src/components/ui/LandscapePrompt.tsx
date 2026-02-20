import { useEffect, useState } from 'react'
import './LandscapePrompt.css'

export default function LandscapePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  
  useEffect(() => {
    const checkOrientation = () => {
      // Solo en dispositivos móviles y en portrait
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
      const isPortrait = window.innerHeight > window.innerWidth
      
      setShowPrompt(isMobile && isPortrait && !dismissed)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [dismissed])
  
  const handleDismiss = () => {
    setDismissed(true)
    setShowPrompt(false)
  }
  
  if (!showPrompt) return null
  
  return (
    <div className="landscape-prompt">
      <div className="landscape-content">
        <div className="rotate-icon">📱</div>
        <div className="rotate-arrow">↻</div>
        <h2>Gira tu teléfono</h2>
        <p>Esta experiencia está diseñada para verse en horizontal. Gira tu dispositivo para disfrutarla mejor.</p>
        <button className="dismiss-btn" onClick={handleDismiss}>
          Continuar en vertical
        </button>
      </div>
    </div>
  )
}
