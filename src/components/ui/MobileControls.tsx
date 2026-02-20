import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import './MobileControls.css'

export default function MobileControls() {
  const [isMobile, setIsMobile] = useState(false)
  
  // Estado para joystick izquierdo (dirección/cámara)
  const [leftActive, setLeftActive] = useState(false)
  const [leftPos, setLeftPos] = useState({ x: 0, y: 0 })
  
  // Estado para joystick derecho (movimiento adelante/atrás)
  const [rightActive, setRightActive] = useState(false)
  const [rightPos, setRightPos] = useState({ x: 0, y: 0 })
  
  const { setMobileInput, currentSection, isWarping } = useAppStore()
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      )
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  if (!isMobile || currentSection || isWarping) return null
  
  // Función helper para calcular posición del joystick
  const calcJoystickPos = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = (touch.clientX - centerX) / (rect.width / 2)
    const deltaY = (touch.clientY - centerY) / (rect.height / 2)
    
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const clampedX = length > 1 ? deltaX / length : deltaX
    const clampedY = length > 1 ? deltaY / length : deltaY
    
    return { x: clampedX, y: clampedY }
  }
  
  // === JOYSTICK IZQUIERDO (Dirección/Cámara) ===
  const handleLeftStart = () => {
    setLeftActive(true)
  }
  
  const handleLeftMove = (e: React.TouchEvent) => {
    if (!leftActive) return
    
    const pos = calcJoystickPos(e)
    setLeftPos({ x: pos.x * 30, y: pos.y * 30 })
    setMobileInput({ lookX: pos.x, lookY: -pos.y })
  }
  
  const handleLeftEnd = () => {
    setLeftActive(false)
    setLeftPos({ x: 0, y: 0 })
    setMobileInput({ lookX: 0, lookY: 0 })
  }
  
  // === JOYSTICK DERECHO (Movimiento adelante/atrás) ===
  const handleRightStart = () => {
    setRightActive(true)
  }
  
  const handleRightMove = (e: React.TouchEvent) => {
    if (!rightActive) return
    
    const pos = calcJoystickPos(e)
    setRightPos({ x: pos.x * 30, y: pos.y * 30 })
    setMobileInput({ moveY: -pos.y })
  }
  
  const handleRightEnd = () => {
    setRightActive(false)
    setRightPos({ x: 0, y: 0 })
    setMobileInput({ moveY: 0 })
  }
  
  return (
    <div className="mobile-controls">
      {/* Instrucciones */}
      <div className="mobile-instructions">
        ← Dirección &nbsp;•&nbsp; Movimiento →
      </div>
      
      {/* Joystick izquierdo - DIRECCIÓN/CÁMARA */}
      <div 
        className="joystick-container left"
        onTouchStart={handleLeftStart}
        onTouchMove={handleLeftMove}
        onTouchEnd={handleLeftEnd}
      >
        <div className="joystick-base direction">
          <div 
            className="joystick-handle"
            style={{
              transform: `translate(${leftPos.x}px, ${leftPos.y}px)`
            }}
          />
          <span className="joystick-label">🎯</span>
        </div>
      </div>
      
      {/* Joystick derecho - MOVIMIENTO */}
      <div 
        className="joystick-container right"
        onTouchStart={handleRightStart}
        onTouchMove={handleRightMove}
        onTouchEnd={handleRightEnd}
      >
        <div className="joystick-base movement">
          <div 
            className="joystick-handle"
            style={{
              transform: `translate(${rightPos.x}px, ${rightPos.y}px)`
            }}
          />
          <span className="joystick-label">🚀</span>
        </div>
      </div>
    </div>
  )
}
