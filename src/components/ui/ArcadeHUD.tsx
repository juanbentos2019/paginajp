import { useAppStore } from '../../stores/useAppStore'
import './ArcadeHUD.css'

export default function ArcadeHUD() {
  const { 
    isPlayingArcade, 
    arcadeScore, 
    arcadeHighScore, 
    arcadeLives, 
    arcadeWave,
    arcadeGameOver,
    exitArcade 
  } = useAppStore()
  
  if (!isPlayingArcade || arcadeGameOver) return null
  
  return (
    <div className="arcade-hud">
      {/* Header */}
      <div className="arcade-header">
        <div className="arcade-title">
          <span className="arcade-title-text">🕹️ GALAGA SECRETO</span>
          <span className="arcade-wave">OLEADA {arcadeWave}</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="arcade-stats">
        <div className="arcade-stat">
          <span className="stat-label">SCORE</span>
          <span className="stat-value score">{arcadeScore.toLocaleString()}</span>
        </div>
        
        <div className="arcade-stat">
          <span className="stat-label">HIGH</span>
          <span className="stat-value high">{arcadeHighScore.toLocaleString()}</span>
        </div>
        
        <div className="arcade-stat">
          <span className="stat-label">VIDAS</span>
          <span className="stat-value lives">
            {'❤️'.repeat(arcadeLives)}
            {'🖤'.repeat(Math.max(0, 3 - arcadeLives))}
          </span>
        </div>
      </div>
      
      {/* Controles */}
      <div className="arcade-controls">
        <div className="control-group">
          <span className="control-key">← →</span>
          <span className="control-desc">Mover</span>
        </div>
        <div className="control-group">
          <span className="control-key">SPACE</span>
          <span className="control-desc">Disparar</span>
        </div>
        <div className="control-group">
          <span className="control-key">ESC</span>
          <span className="control-desc">Salir</span>
        </div>
      </div>
      
      {/* Botón salir (móvil) */}
      <button className="arcade-exit-btn" onClick={exitArcade}>
        ✕ SALIR
      </button>
    </div>
  )
}
