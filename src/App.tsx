import { useState, useCallback } from 'react'
import HomeScreen from './components/HomeScreen'
import PlinkoGame from './components/PlinkoGame'
import './App.css'

type Screen = 'home' | 'playing' | 'gameover'

interface Level {
  level: number
  goal: number
  balls: number
}

function getLevelConfig(level: number): Level {
  return {
    level,
    goal: 100 + (level - 1) * 50,
    balls: 5 + Math.floor((level - 1) / 3),
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [ballsRemaining, setBallsRemaining] = useState(5)
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('plinko-highscore') || '0', 10)
  })
  const [bestLevel, setBestLevel] = useState(() => {
    return parseInt(localStorage.getItem('plinko-bestlevel') || '0', 10)
  })
  const [paused, setPaused] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const levelConfig = getLevelConfig(level)

  const startGame = useCallback(() => {
    setLevel(1)
    setScore(0)
    setBallsRemaining(getLevelConfig(1).balls)
    setPaused(false)
    setLevelComplete(false)
    setGameOver(false)
    setScreen('playing')
  }, [])

  const handleScore = useCallback((points: number) => {
    setScore(prev => {
      const newScore = prev + points
      // Check if goal reached
      const config = getLevelConfig(level)
      if (newScore >= config.goal && !levelComplete) {
        setLevelComplete(true)
        setPaused(true)
      }
      return newScore
    })
  }, [level, levelComplete])

  const handleBallDropped = useCallback(() => {
    setBallsRemaining(prev => prev - 1)
  }, [])

  const handleNextLevel = useCallback(() => {
    const nextLevel = level + 1
    setLevel(nextLevel)
    setScore(0)
    setBallsRemaining(getLevelConfig(nextLevel).balls)
    setLevelComplete(false)
    setPaused(false)
  }, [level])

  // Check game over when balls run out
  const checkGameOver = useCallback(() => {
    if (ballsRemaining <= 0 && !levelComplete && !gameOver) {
      // Wait a moment for last ball to settle
      setTimeout(() => {
        setScore(currentScore => {
          if (currentScore < levelConfig.goal) {
            // Game over
            setHighScore(prev => {
              const newHigh = Math.max(prev, currentScore)
              localStorage.setItem('plinko-highscore', newHigh.toString())
              return newHigh
            })
            setBestLevel(prev => {
              const newBest = Math.max(prev, level - 1)
              localStorage.setItem('plinko-bestlevel', newBest.toString())
              return newBest
            })
            setGameOver(true)
            setPaused(true)
          }
          return currentScore
        })
      }, 2000)
    }
  }, [ballsRemaining, levelComplete, gameOver, levelConfig.goal, level])

  // Trigger game over check
  if (ballsRemaining <= 0 && !levelComplete && !gameOver && screen === 'playing') {
    checkGameOver()
  }

  const handleRestart = useCallback(() => {
    setScreen('home')
    setGameOver(false)
    setPaused(false)
  }, [])

  if (screen === 'home') {
    return <HomeScreen onStart={startGame} highScore={highScore} bestLevel={bestLevel} />
  }

  return (
    <div className="game-screen">
      <div className="hud">
        <button className="hud-back" onClick={() => setScreen('home')}>←</button>
        <div className="hud-item">
          <span className="hud-label">Level</span>
          <span className="hud-value">{level}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Score</span>
          <span className="hud-value">{score}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Goal</span>
          <span className="hud-value">{levelConfig.goal}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Balls</span>
          <span className="hud-value">{ballsRemaining}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, (score / levelConfig.goal) * 100)}%` }}
        />
      </div>

      <PlinkoGame
        onScore={handleScore}
        ballsRemaining={ballsRemaining}
        onBallDropped={handleBallDropped}
        paused={paused}
      />

      {levelComplete && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Level {level} Complete!</h2>
            <p>Score: {score} / Goal: {levelConfig.goal}</p>
            <button className="overlay-button" onClick={handleNextLevel}>
              Next Level →
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Game Over</h2>
            <p>You reached Level {level}</p>
            <p>Score: {score} / Goal: {levelConfig.goal}</p>
            {score > highScore && <p className="new-record">🎉 New High Score!</p>}
            <button className="overlay-button" onClick={handleRestart}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
