# Human Inbox

Messages from agents that need human attention. Do NOT delete entries — only append.

---

### 2026-03-20 | developer | Project initialized
Voidcrawl has been set up with a playable MVP. The following items need human action:

1. **GitHub repo**: Need to create `benwalker14/voidcrawl` on GitHub (or preferred name)
human response: done
2. **Vercel deployment**: Connect the repo to Vercel for auto-deploy
human response: done
3. **Domain**: Eventually need a domain (voidcrawl.io, voidcrawl.gg, etc.) — no rush
human response: deferring till later
4. **Agent scheduling**: Set up Windows Task Scheduler tasks (same pattern as DevBolt)
human response: done.

---

## 2026-03-20 12:00 - Daily Report

**From:** Reporter Agent
**Priority:** Info

### What Happened
- **Developer agent** completed initial project setup: Next.js 16 scaffold, core game engine (dungeon generation, combat, FOV, canvas rendering), and playable MVP with procedural dungeons, enemies, and floor progression
- **Human** responded to all 4 pending items: GitHub repo created, Vercel connected, domain deferred, agent scheduling set up
- No other agent activity logged yet (health, designer, strategist agents have not run)

### Current Status
- Tasks completed: 10 (full MVP foundation)
- Tasks in progress: 0
- Tasks pending: ~25 across P0–P3
- App health: Unknown — no health agent run yet. Recommend triggering a health check to confirm build and deployment status.

### Game State
- **Current feature set:** Procedural dungeon generation, player movement (arrow keys/WASD), turn-based bump-to-attack combat, enemy AI (chase behavior), field of view, HUD (HP/floor/turns), message log, death/restart flow, floor progression via stairs
- **Next priorities:**
  1. **P0** — Deploy to Vercel and confirm production URL is live
  2. **P0** — Add ESLint config (partially done, file exists but may need verification)
  3. **P1** — Add item/loot system (weapons, armor, potions) — this is the biggest gameplay gap

### Financial Summary
- Total spent: $0 (all services on free tiers)
- Total revenue: $0 (pre-launch)

### Decisions Needed
- **Production URL**: Vercel is connected — what is the production URL? Please update CLAUDE.md with it.
- **Agent run frequency**: Scheduler is set up, but no agents beyond the developer have run yet. Worth confirming the schedule is triggering correctly.
- **ESLint config**: There's a modified `eslint.config.mjs` in the working tree (unstaged). Should this be committed, or is it still being tuned?

---

### 2026-03-20 | strategist | Player Experience Audit — decisions needed

**From:** Strategist Agent (first session)
**Priority:** Medium

I completed a full UX audit of the game. Here's what I found and what needs your input:

#### Key Findings
The game's core loop is solid (movement, combat, loot, leveling, AI are all working well), but the **player-facing experience** has significant gaps that will hurt retention:

1. **No way to learn the game** — No help screen, no tutorial, no legend for enemy types or item rarities. Players must figure everything out by trial and error. This is the single biggest friction point.
2. **Zero visual combat feedback** — Combat only shows text in the message log. No damage numbers, no color changes, no animations. The game *feels* static even though the systems underneath are deep.
3. **Death screen undersells the run** — Only shows level/floor/turns. Adding enemies killed, items found, and personal bests would create "one more run" motivation.
4. **Mobile is completely broken** — No viewport meta tag (rendering will be wrong), no touch controls (literally unplayable on phones).

#### Decision Needed: Mobile Priority

Mobile browser games are a huge potential audience, but adding touch controls and responsive layout is moderate effort. Options:

- **A) Prioritize mobile now (P1)** — Build touch controls and responsive layout before adding more content. Gets more players in sooner.
- **B) Defer mobile (keep at P3)** — Focus on desktop experience and content depth first. Add mobile later when the game has more to offer.
- **C) Minimal mobile (P2)** — Just add the viewport meta tag and basic touch controls (virtual D-pad). Skip full responsive redesign.

I've set mobile tasks at P2 for now (option C). Let me know if you want to reprioritize.

#### What I Added to the Task Board
- 5 new P1 tasks: help overlay, color-coded messages, rich death screen, pause menu, floating damage numbers
- 6 new P2 tasks: mobile touch controls, viewport meta, larger fonts, personal best tracking, item comparison tooltips, movement animation
- 3 new P3 tasks: colorblind mode, ARIA screen reader support, semantic HTML

All suggestions comply with the ethics rules (no dark patterns, no monetization hooks).

---

### 2026-03-20 | strategist | Content Depth Audit — decisions needed

**From:** Strategist Agent (second session — Content Planning)
**Priority:** Medium-High

I audited the game's full content inventory and compared it against 6 benchmark roguelikes (Brogue, DCSS, Shattered PD, Hades, Caves of Qud, Slay the Spire). The core systems (combat, AI, loot, leveling) are solid, but the **content depth is well below the minimum for player retention**.

#### The Numbers

| Content | Voidcrawl Now | Minimum for 10+ hrs | Gap |
|---------|--------------|---------------------|-----|
| Enemy types | 9 | 20-25 | Big |
| Bosses | 0 | 3-4 | Critical |
| Consumable types | 1 (healing only) | 6-8 | Critical |
| Floor themes | 0 | 3 | Big |
| Item special effects | 0 | 5-8 | Big |
| Environmental hazards | 0 | 3-4 | Moderate |

#### What I Recommend Building First (in order)

1. **Consumable variety** — Add 6 potion types (Haste, Invisibility, Teleport, Fire, Poison, Strength) + 4 scrolls (Magic Mapping, Enchanting, Fear, Summon). This is the single biggest bang-for-buck content addition. Every successful roguelike has 8-15 consumable types because they create tactical decisions every turn.

2. **Enemy special abilities** — Retrofit existing enemies with unique mechanics (slime splits on death, shade drains life, wisp phases through attacks, wraith moves through walls). Zero new sprites needed, just behavior code. Makes every enemy encounter tactically different.

3. **Floor 5 boss** — "Void Nucleus" that spawns adds and must be focus-fired during pauses. Gives players their first concrete milestone goal. Guaranteed rare loot on kill.

4. **Weapon/armor runics** — Vampiric sword, flaming blade, thorned armor, etc. Makes loot decisions interesting beyond "bigger number = better."

5. **3 floor themes** — Color palette swaps + distinct enemy pools per zone. Massive perceived variety for minimal code.

#### Decision Needed: Content vs. Polish Priority

The game currently has ~2 hours of unique content before repetition sets in. Two paths:

- **A) Content-first:** Prioritize items 1-5 above. Delay visual polish (sprites, animations, screen shake) until the game has enough content to retain players. This is the Dwarf Fortress / Brogue philosophy — depth over looks.

- **B) Polish-first:** Continue with P1 visual polish tasks (floating damage numbers, animations). Ship a beautiful but shallow game, add content later. Risk: players try the game once, see its pretty but shallow, and don't return.

- **C) Interleave:** Alternate content and polish tasks. Slower on both fronts but steady progress on each.

**My recommendation: Option A (content-first).** The game's ASCII art style is already working — players of browser roguelikes expect this aesthetic. What they won't tolerate is running out of new things to discover on floor 3. Consumables + enemy abilities + one boss would 3x the game's tactical depth.

I've promoted the top 4 content items to **P1** on the task board. Let me know if you want to reprioritize.

#### Key Design Principle Discovered

Across all 6 benchmark games: **replayability comes from combinatorial interactions, not raw content volume.** Brogue has 68 enemies and ~70 items but achieves extraordinary depth because items interact with enemies and the environment. Every new element we add should multiply the possibility space — a Fire potion should interact with slime splitting, a Stun runic should synergize with Vorpal (stun then execute). I've flagged this for the developer agents to keep in mind.

---
