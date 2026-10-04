interface HomeScreenProps {
  onStart: () => void
  highScore: number
  bestLevel: number
}

export default function HomeScreen({ onStart, highScore, bestLevel }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <div className="home-content">
        <h1 className="home-title">PLINKO<span className="accent">DROP</span></h1>
        <p className="home-subtitle">Drop the ball, hit the targets, climb the levels.</p>
        {(highScore > 0 || bestLevel > 0) && (
          <div className="home-stats">
            <div className="stat-item">
              <span className="stat-label">Best Score</span>
              <span className="stat-value">{highScore.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Best Level</span>
              <span className="stat-value">{bestLevel}</span>
            </div>
          </div>
        )}
        <button className="play-button" onClick={onStart}>
          PLAY
        </button>
        <p className="home-hint">Tap the board to drop balls. Land in high-value slots to reach your goal!</p>
      </div>
    </div>
  )
}
