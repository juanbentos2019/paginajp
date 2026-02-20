import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { database } from '../../lib/firebase'
import { ref, push, query, orderByChild, limitToLast, onValue } from 'firebase/database'
import './ArcadeGameOver.css'

interface HighScore {
  id: string
  score: number
  wave: number
  timestamp: number
}

export default function ArcadeGameOver() {
  const { 
    isPlayingArcade, 
    arcadeGameOver, 
    arcadeScore, 
    arcadeHighScore,
    arcadeWave,
    resetArcade, 
    exitArcade,
    playerId
  } = useAppStore()
  
  const [highScores, setHighScores] = useState<HighScore[]>([])
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  
  // Cargar high scores de Firebase
  useEffect(() => {
    const scoresRef = query(
      ref(database, 'arcade/highscores'),
      orderByChild('score'),
      limitToLast(10)
    )
    
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const scores: HighScore[] = []
      snapshot.forEach((child) => {
        scores.push({
          id: child.key!,
          ...child.val()
        })
      })
      // Ordenar de mayor a menor
      scores.sort((a, b) => b.score - a.score)
      setHighScores(scores)
    })
    
    return () => unsubscribe()
  }, [])
  
  // Liberar pointer lock cuando aparece Game Over
  useEffect(() => {
    if (arcadeGameOver && isPlayingArcade) {
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
    }
  }, [arcadeGameOver, isPlayingArcade])
  
  // Guardar score en Firebase si es game over
  useEffect(() => {
    if (arcadeGameOver && arcadeScore > 0 && !scoreSaved && isPlayingArcade) {
      // Verificar si es nuevo récord personal
      if (arcadeScore > arcadeHighScore) {
        setIsNewRecord(true)
      }
      
      // Guardar en Firebase
      const scoresRef = ref(database, 'arcade/highscores')
      push(scoresRef, {
        score: arcadeScore,
        wave: arcadeWave,
        playerId: playerId || 'anonymous',
        timestamp: Date.now()
      })
      
      setScoreSaved(true)
    }
  }, [arcadeGameOver, arcadeScore, arcadeHighScore, arcadeWave, playerId, scoreSaved, isPlayingArcade])
  
  // Reset cuando se cierra
  useEffect(() => {
    if (!arcadeGameOver) {
      setScoreSaved(false)
      setIsNewRecord(false)
    }
  }, [arcadeGameOver])
  
  const handleRetry = () => {
    resetArcade()
    useAppStore.getState().startArcade()
  }
  
  const handleExit = () => {
    resetArcade()
    exitArcade()
  }
  
  if (!isPlayingArcade || !arcadeGameOver) return null
  
  return (
    <div className="arcade-gameover">
      <div className="gameover-modal">
        {/* Glitch effect */}
        <div className="gameover-glitch" />
        
        {/* Title */}
        <h1 className="gameover-title">
          <span className="glitch-text" data-text="GAME OVER">GAME OVER</span>
        </h1>
        
        {/* New Record */}
        {isNewRecord && (
          <div className="new-record">
            🏆 ¡NUEVO RÉCORD PERSONAL! 🏆
          </div>
        )}
        
        {/* Score */}
        <div className="gameover-score">
          <div className="score-item">
            <span className="score-label">PUNTUACIÓN</span>
            <span className="score-value main">{arcadeScore.toLocaleString()}</span>
          </div>
          <div className="score-item">
            <span className="score-label">OLEADA</span>
            <span className="score-value wave">{arcadeWave}</span>
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="gameover-leaderboard">
          <h3 className="leaderboard-title">🎮 TOP 10 MUNDIAL</h3>
          <div className="leaderboard-list">
            {highScores.map((score, index) => (
              <div 
                key={score.id} 
                className={`leaderboard-item ${score.score === arcadeScore ? 'current' : ''}`}
              >
                <span className="rank">#{index + 1}</span>
                <span className="lb-score">{score.score.toLocaleString()}</span>
                <span className="lb-wave">W{score.wave}</span>
              </div>
            ))}
            {highScores.length === 0 && (
              <div className="leaderboard-empty">Cargando...</div>
            )}
          </div>
        </div>
        
        {/* Buttons */}
        <div className="gameover-buttons">
          <button className="btn-retry" onClick={handleRetry}>
            🔄 REINTENTAR
          </button>
          <button className="btn-exit" onClick={handleExit}>
            🚀 VOLVER AL ESPACIO
          </button>
        </div>
        
        {/* Easter egg message */}
        <p className="gameover-message">
          Has encontrado el arcade secreto. Tu persistencia es admirable.
        </p>
      </div>
    </div>
  )
}
