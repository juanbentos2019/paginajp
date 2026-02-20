import './Loader.css'

interface LoaderProps {
  progress?: number
}

export default function Loader({ progress = 0 }: LoaderProps) {
  return (
    <div className="loader">
      <div className="loader-content">
        <div className="loader-bar">
          <div 
            className="loader-progress" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <span className="loader-text">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
