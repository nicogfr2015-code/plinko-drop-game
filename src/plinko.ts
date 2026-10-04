// Plinko physics engine — handles ball dropping, peg collisions, and slot scoring

export interface Peg {
  x: number
  y: number
  radius: number
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  settled: boolean
  slotIndex: number
}

export interface Slot {
  x: number
  width: number
  points: number
  label: string
  color: string
}

export interface GameState {
  balls: Ball[]
  pegs: Peg[]
  slots: Slot[]
  width: number
  height: number
}

const GRAVITY = 0.18
const FRICTION = 0.998
const BOUNCE = 0.55
const BALL_RADIUS = 9
const PEG_RADIUS = 5
const PEG_ROWS = 12

export function createGame(width: number, height: number): GameState {
  const pegs: Peg[] = []
  const topMargin = 80
  const bottomMargin = 120
  const sideMargin = 40
  const playWidth = width - sideMargin * 2
  const rowSpacing = (height - topMargin - bottomMargin) / (PEG_ROWS - 1)

  for (let row = 0; row < PEG_ROWS; row++) {
    const offset = row % 2 === 0 ? 0 : playWidth / (PEG_ROWS + 1) / 2
    const pegsInRow = row % 2 === 0 ? PEG_ROWS + 1 : PEG_ROWS
    const colSpacing = playWidth / pegsInRow
    for (let col = 0; col < pegsInRow; col++) {
      pegs.push({
        x: sideMargin + colSpacing * col + colSpacing / 2 + offset,
        y: topMargin + rowSpacing * row,
        radius: PEG_RADIUS,
      })
    }
  }

  // Scoring slots at the bottom
  const numSlots = PEG_ROWS + 2
  const slotWidth = playWidth / numSlots
  const slots: Slot[] = []
  const slotPoints = generateSlotPoints(numSlots)

  for (let i = 0; i < numSlots; i++) {
    slots.push({
      x: sideMargin + slotWidth * i,
      width: slotWidth,
      points: slotPoints[i].points,
      label: slotPoints[i].label,
      color: slotPoints[i].color,
    })
  }

  return { balls: [], pegs, slots, width, height }
}

function generateSlotPoints(numSlots: number): { points: number; label: string; color: string }[] {
  // Bell-curve-ish scoring: edges are high value, center is low
  const mid = Math.floor(numSlots / 2)
  const result: { points: number; label: string; color: string }[] = []
  for (let i = 0; i < numSlots; i++) {
    const dist = Math.abs(i - mid)
    const points = dist * 10 + (dist === mid ? 0 : 10)
    let color = '#475569'
    if (dist >= mid - 1) color = '#f59e0b'
    if (dist === mid) color = '#64748b'
    if (dist >= 2) color = '#10b981'
    if (dist >= 3) color = '#8b5cf6'
    result.push({ points, label: points.toString(), color })
  }
  return result
}

export function dropBall(game: GameState, x: number): void {
  game.balls.push({
    x,
    y: 20,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0,
    radius: BALL_RADIUS,
    settled: false,
    slotIndex: -1,
  })
}

export function updatePhysics(game: GameState): { scoredPoints: number; scoredSlot: number }[] {
  const scored: { scoredPoints: number; scoredSlot: number }[] = []

  for (const ball of game.balls) {
    if (ball.settled) continue

    // Apply gravity
    ball.vy += GRAVITY
    ball.vx *= FRICTION

    // Move
    ball.x += ball.vx
    ball.y += ball.vy

    // Wall collisions
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius
      ball.vx = Math.abs(ball.vx) * BOUNCE
    }
    if (ball.x + ball.radius > game.width) {
      ball.x = game.width - ball.radius
      ball.vx = -Math.abs(ball.vx) * BOUNCE
    }

    // Peg collisions
    for (const peg of game.pegs) {
      const dx = ball.x - peg.x
      const dy = ball.y - peg.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = ball.radius + peg.radius
      if (dist < minDist && dist > 0) {
        // Normalize collision vector
        const nx = dx / dist
        const ny = dy / dist
        // Push ball out
        const overlap = minDist - dist
        ball.x += nx * overlap
        ball.y += ny * overlap
        // Reflect velocity
        const dot = ball.vx * nx + ball.vy * ny
        ball.vx = (ball.vx - 2 * dot * nx) * BOUNCE
        ball.vy = (ball.vy - 2 * dot * ny) * BOUNCE
        // Add small random nudge
        ball.vx += (Math.random() - 0.5) * 0.3
      }
    }

    // Check if ball reached the slot area
    const slotY = game.height - 120
    if (ball.y > slotY + 20) {
      // Determine which slot
      let slotIndex = -1
      for (let i = 0; i < game.slots.length; i++) {
        const slot = game.slots[i]
        if (ball.x >= slot.x && ball.x < slot.x + slot.width) {
          slotIndex = i
          break
        }
      }
      if (slotIndex >= 0) {
        ball.settled = true
        ball.slotIndex = slotIndex
        scored.push({ scoredPoints: game.slots[slotIndex].points, scoredSlot: slotIndex })
      }
    }

    // Remove balls that fall off
    if (ball.y > game.height + 50) {
      ball.settled = true
    }
  }

  // Clean up settled balls that are well below the play area
  game.balls = game.balls.filter(b => !(b.settled && b.y > game.height + 100))

  return scored
}

export function renderGame(ctx: CanvasRenderingContext2D, game: GameState): void {
  const { width, height } = game

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, '#1e293b')
  grad.addColorStop(1, '#0f172a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // Pegs
  for (const peg of game.pegs) {
    ctx.beginPath()
    ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#64748b'
    ctx.fill()
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1
    ctx.stroke()
    // Highlight
    ctx.beginPath()
    ctx.arc(peg.x - 1.5, peg.y - 1.5, peg.radius * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fill()
  }

  // Slots
  const slotY = game.height - 120
  for (const slot of game.slots) {
    // Slot background
    ctx.fillStyle = slot.color + '33'
    ctx.fillRect(slot.x, slotY, slot.width, 120)
    // Divider lines
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(slot.x, slotY)
    ctx.lineTo(slot.x, slotY + 120)
    ctx.stroke()
    // Points label
    ctx.fillStyle = slot.color
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(slot.label, slot.x + slot.width / 2, slotY + 70)
  }
  // Last divider
  const lastSlot = game.slots[game.slots.length - 1]
  if (lastSlot) {
    ctx.beginPath()
    ctx.moveTo(lastSlot.x + lastSlot.width, slotY)
    ctx.lineTo(lastSlot.x + lastSlot.width, slotY + 120)
    ctx.stroke()
  }

  // Balls
  for (const ball of game.balls) {
    if (ball.settled && ball.y > game.height) continue
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    const ballGrad = ctx.createRadialGradient(
      ball.x - 3, ball.y - 3, 1,
      ball.x, ball.y, ball.radius,
    )
    ballGrad.addColorStop(0, '#fbbf24')
    ballGrad.addColorStop(1, '#f59e0b')
    ctx.fillStyle = ballGrad
    ctx.fill()
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
