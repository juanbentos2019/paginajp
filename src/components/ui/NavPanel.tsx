import { useAppStore } from '../../stores/useAppStore'
import './NavPanel.css'

export default function NavPanel() {
  const { 
    shipPosition, 
    shipSpeed, 
    currentSection, 
    isPlayingArcade,
    isWarping 
  } = useAppStore()
  
  // No mostrar durante sección, arcade o warp
  if (currentSection || isPlayingArcade || isWarping) return null
  
  // Formatear coordenadas
  const formatCoord = (val: number) => {
    const sign = val >= 0 ? '+' : ''
    return sign + val.toFixed(1)
  }
  
  // Formatear velocidad (convertir a unidades más legibles)
  const speedDisplay = (shipSpeed * 10).toFixed(1)
  
  // Determinar color de velocidad (ajustado a velocidades reales del juego)
  const getSpeedColor = () => {
    if (shipSpeed > 20) return '#ff4444' // Muy rápido (boost extremo)
    if (shipSpeed > 10) return '#ffaa00' // Rápido (con boost)
    if (shipSpeed > 2) return '#00ff88'  // Normal
    return '#666666' // Lento/parado
  }
  
  return (
    <div className="nav-panel">
      <div className="nav-panel-header">
        <span className="nav-icon">◈</span>
        <span className="nav-title">NAV DATA</span>
      </div>
      
      <div className="nav-section">
        <div className="nav-label">VELOCITY</div>
        <div className="nav-speed" style={{ color: getSpeedColor() }}>
          <span className="speed-value">{speedDisplay}</span>
          <span className="speed-unit">u/s</span>
        </div>
        <div className="speed-bar">
          <div 
            className="speed-bar-fill" 
            style={{ 
              width: `${Math.min(shipSpeed / 30 * 100, 100)}%`,
              backgroundColor: getSpeedColor()
            }} 
          />
        </div>
      </div>
      
      <div className="nav-section">
        <div className="nav-label">POSITION</div>
        <div className="nav-coords">
          <div className="coord">
            <span className="coord-axis">X</span>
            <span className="coord-value">{formatCoord(shipPosition.x)}</span>
          </div>
          <div className="coord">
            <span className="coord-axis">Y</span>
            <span className="coord-value">{formatCoord(shipPosition.y)}</span>
          </div>
          <div className="coord">
            <span className="coord-axis">Z</span>
            <span className="coord-value">{formatCoord(shipPosition.z)}</span>
          </div>
        </div>
      </div>
      
      <div className="nav-grid">
        <div className="grid-dot" style={{ 
          left: `${50 + (shipPosition.x / 500) * 45}%`,
          top: `${50 - (shipPosition.z / 500) * 45}%`
        }} />
        <div className="grid-center" />
      </div>
    </div>
  )
}
