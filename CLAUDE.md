# Voidcrawl - Autonomous Browser Roguelike

## Overview
Voidcrawl is a turn-based browser roguelike dungeon crawler. Players descend through procedurally generated void-themed dungeons, fight enemies, collect loot, and try to survive as deep as possible. Every run is different.

**Owner:** Vincent (GitHub: benwalker14)
**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, HTML5 Canvas rendering
**Production URL:** TBD (will be on Vercel)
**Revenue Model:** Free core game + paid content packs (hero classes, dungeon themes, cosmetics). No loot boxes, no energy timers, no pay-to-win.

## Ethics
This game must be fun because it's a good game, not because it exploits psychological hooks.
- NO idle/addiction mechanics
- NO FOMO (fear of missing out) or streak pressure
- NO loot boxes or randomized purchases
- NO pay-to-win mechanics
- NO energy timers or wait-to-play gates
- Monetization is content-based only: you pay for more stuff to play with, not to skip waiting

## Architecture
- `src/app/` - Next.js App Router pages
- `src/app/play/` - Main game page (client-side rendered)
- `src/game/` - Core game engine (pure TypeScript, no React)
  - `config.ts` - Constants, types, interfaces
  - `engine.ts` - Game state management, turn processing, combat
  - `renderer.ts` - HTML5 Canvas rendering
  - `generation/` - Procedural content (dungeons, enemies, items)
  - `entities/` - Entity definitions and behaviors
  - `data/` - Static data (enemy templates, item pools, etc.)
- `src/components/` - React components (GameCanvas, UI overlays)
- `public/assets/` - Sprites, audio, etc.
- `agents/` - Agent prompts and scripts

## Game Design
- Turn-based: nothing happens until the player acts
- Roguelike: permadeath, procedural generation, tactical depth
- Controls: Arrow keys / WASD to move, Space to wait
- Combat: bump-to-attack (walk into enemies)
- Progression: descend floors via stairs (>), enemies scale with depth
- FOV: players can only see what's in line of sight

## Agent System
This project is autonomously managed by Claude Code agents.

### Agent Types
- **health**: Checks builds, runs lints, verifies deployment (every 4 hours)
- **developer**: Implements features, fixes bugs, balances gameplay (twice daily)
- **designer**: Creates new content (enemies, items, floor themes), balances numbers (daily)
- **strategist**: Plans features, analyzes player feedback, plans monetization (daily)
- **reporter**: Summarizes activities and writes updates to HUMAN_INBOX.md (daily)

### Agent Rules
1. ALWAYS read TASK_BOARD.md before starting work
2. ALWAYS log activities to AGENT_LOG.md (append, never overwrite). Use datetime format: `### YYYY-MM-DD HH:MM | agent-type | description`
3. NEVER spend money without logging to FINANCES.md and writing to HUMAN_INBOX.md
4. ALWAYS commit with clear, descriptive messages
5. ALWAYS push to GitHub after committing
6. Run `npm run build` before pushing to verify no build errors
7. Write to HUMAN_INBOX.md when you need human input
8. Keep TASK_BOARD.md updated as you complete or add tasks
9. Do NOT delete or overwrite HUMAN_INBOX.md entries - only append
10. Respect the budget rules in FINANCES.md
11. NEVER add predatory monetization mechanics (see Ethics section above)
12. Game changes should be playtested by running `npm run dev` and verifying behavior

## Key Commands
- `npm run dev` - Start dev server (port 3001)
- `npm run build` - Production build (always run before pushing)
- `npm run lint` - Run ESLint
- `git push origin master` - Deploy (Vercel auto-deploys from master)
