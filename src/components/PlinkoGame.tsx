import { useEffect, useRef, useCallback, useState } from 'react'
import {
  createGame,
  dropBall,
  updatePhysics,
  renderGame,
  type GameState,
} from '../plinko'

interface PlinkoGameProps {
  onScore: (points: number) => void
  ballsRemaining: number
  onBallDropped: () => void
  paused: boolean
}

export default function PlinkoGame({ onScore, ballsRemaining, onBallDropped, paused }: PlinkoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState | null>(null)
  const animationRef = useRef<number>(0)
  const onScoreRef = useRef(onScore)
  const onBallDroppedRef = useRef(onBallDropped)
  const pausedRef = useRef(paused)

  onScoreRef.current = onScore
  onBallDroppedRef.current = onBallDropped
  pausedRef.current = paused

  const [canDrop, setCanDrop] = useState(true)

  // Initialize and resize game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    gameRef.current = createGame(rect.width, rect.height)
  }, [])

  useEffect(() => {
    initGame()
    const handleResize = () => {
      initGame()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [initGame])

  // Animation loop
  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current
      const game = gameRef.current
      if (!canvas || !game) {
        animationRef.current = requestAnimationFrame(loop)
        return
      }
      const ctx = canvas.getContext('2d')!

      if (!pausedRef.current) {
        const scored = updatePhysics(game)
        for (const s of scored) {
          onScoreRef.current(s.scoredPoints)
        }
      }

      renderGame(ctx, game)
      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationRef.current)
  }, [])

  // Handle drop input
  const handleDrop = useCallback((clientX: number) => {
    const canvas = canvasRef.current
    const game = gameRef.current
    if (!canvas || !game || pausedRef.current) return
    if (ballsRemaining <= 0) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    // Clamp within play area
    const clampedX = Math.max(20, Math.min(game.width - 20, x))
    dropBall(game, clampedX)
    onBallDroppedRef.current()
    setCanDrop(false)
    setTimeout(() => setCanDrop(true), 250)
  }, [ballsRemaining])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleDrop(e.clientX)
  }

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (e.touches.length > 0) {
      handleDrop(e.touches[0].clientX)
    }
  }

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleTouch}
        style={{ touchAction: 'none' }}
      />
      {ballsRemaining <= 0 && (
        <div className="drop-hint">No balls left — waiting for results…</div>
      )}
      {ballsRemaining > 0 && (
        <div className="drop-hint">Tap to drop a ball!</div>
      )}
    </div>
  )
}
