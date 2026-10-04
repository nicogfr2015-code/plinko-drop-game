# Plinko Drop Game

A Vite + React + TypeScript endless Plinko game with progressive goals, homescreen, and mobile/desktop support.

## Setup
- The app is a frontend-only Vite dev server (no backend, no external services, no secrets needed).
- Run: `docker compose -f docker-compose.base44.yml up -d --build`
- Preview is on host port 3000 (mapped to container's Vite dev server on 5173).

## Architecture
- `src/plinko.ts` — Canvas-based physics engine (ball drop, peg collision, slot scoring).
- `src/components/PlinkoGame.tsx` — Canvas rendering + input handling (click/tap to drop).
- `src/components/HomeScreen.tsx` — Landing page with high score / best level display.
- `src/App.tsx` — Game state machine: home → playing → game over, with progressive level goals.

## Notes
- High score and best level persist in `localStorage`.
- No external credentials or secrets required.
